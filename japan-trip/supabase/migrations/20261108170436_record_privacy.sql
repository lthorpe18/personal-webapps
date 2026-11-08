-- Additive privacy controls. Apply as a single transaction; no records removed.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table private.privacy_backups (created_at timestamptz default now(), kind text, payload jsonb);
revoke all on private.privacy_backups from public, anon, authenticated;
insert into private.privacy_backups(kind,payload)
select 'view',jsonb_build_object('name',viewname,'definition',definition) from pg_views where schemaname='public';
insert into private.privacy_backups(kind,payload) select 'policies',to_jsonb(p) from pg_policies p where schemaname='public';
do $$ declare tab text; begin
  foreach tab in array array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets'] loop
    execute format('insert into private.privacy_backups(kind,payload) select %L,to_jsonb(r) from public.%I r',tab,tab);
    execute format('alter table public.%I add column visibility text not null default ''shared'' check (visibility in (''shared'',''private'')), add column private_user_ids uuid[] not null default ''{}''',tab);
  end loop;
end $$;
insert into private.privacy_backups(kind,payload) select 'trips',to_jsonb(t) from public.trips t;

-- Non-exposed helper. Actor NULL means a shared-only snapshot, even for owners.
-- Traverses every parent link; cross-trip links and cycles fail closed.
create function private.record_visible(tab text, rid uuid, tid uuid, actor uuid, path text[] default '{}')
returns boolean language plpgsql stable security definer set search_path='' as $$
declare r jsonb; k text; parent text; owner_id uuid; token text := tab||':'||rid::text;
begin
  if tab <> all(array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets']) or token=any(path) or cardinality(path)>12 then return false; end if;
  execute format('select to_jsonb(r) from public.%I r where id=$1 and trip_id=$2',tab) into r using rid,tid;
  if r is null then return false; end if;
  select created_by into owner_id from public.trips where id=tid;
  if actor is not null and actor<>owner_id and not exists(select 1 from public.trip_members where trip_id=tid and user_id=actor) then return false; end if;
  if r->>'visibility'='private' and (actor is null or (actor<>owner_id and not (r->'private_user_ids' @> to_jsonb(array[actor])))) then return false; end if;
  foreach k in array array['stop_id','booking_id','activity_id','transport_leg_id'] loop
    if r->>k is not null then
      parent := case k when 'stop_id' then 'trip_stops' when 'booking_id' then 'bookings' when 'activity_id' then 'activities' else 'transport_legs' end;
      if not private.record_visible(parent,(r->>k)::uuid,tid,actor,array_append(path,token)) then return false; end if;
    end if;
  end loop;
  return true;
end $$;
revoke all on function private.record_visible(text,uuid,uuid,uuid,text[]) from public;
grant execute on function private.record_visible(text,uuid,uuid,uuid,text[]) to authenticated;

create function private.guard_privacy() returns trigger language plpgsql security definer set search_path='' as $$
declare owner_id uuid; k text; parent text; parent_trip uuid;
begin
  select created_by into owner_id from public.trips where id=new.trip_id;
  if auth.uid() is not null and auth.uid()<>owner_id then
    if (tg_op='INSERT' and (new.visibility<>'shared' or cardinality(new.private_user_ids)>0)) or
       (tg_op='UPDATE' and (new.visibility is distinct from old.visibility or new.private_user_ids is distinct from old.private_user_ids)) then
      raise exception 'Only the trip owner can change privacy';
    end if;
  end if;
  foreach k in array array['stop_id','booking_id','activity_id','transport_leg_id'] loop
    if to_jsonb(new)->>k is not null then
      parent := case k when 'stop_id' then 'trip_stops' when 'booking_id' then 'bookings' when 'activity_id' then 'activities' else 'transport_legs' end;
      execute format('select trip_id from public.%I where id=$1',parent) into parent_trip using (to_jsonb(new)->>k)::uuid;
      if parent_trip is distinct from new.trip_id then raise exception 'Linked records must belong to this trip'; end if;
      if auth.uid() is not null and not private.record_visible(parent,(to_jsonb(new)->>k)::uuid,new.trip_id,auth.uid()) then raise exception 'Linked record is not accessible'; end if;
    end if;
  end loop;
  if exists(select 1 from unnest(new.private_user_ids) u where not exists(select 1 from public.trip_members m where m.trip_id=new.trip_id and m.user_id=u)) then raise exception 'Private access requires trip membership'; end if;
  return new;
end $$;
revoke all on function private.guard_privacy() from public;
do $$ declare tab text; begin
  foreach tab in array array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets'] loop
    execute format('create policy privacy_read on public.%I as restrictive for select to authenticated using (private.record_visible(%L,id,trip_id,(select auth.uid())))',tab,tab);
    execute format('create policy privacy_update on public.%I as restrictive for update to authenticated using (private.record_visible(%L,id,trip_id,(select auth.uid()))) with check (true)',tab,tab);
    execute format('create policy privacy_delete on public.%I as restrictive for delete to authenticated using (private.record_visible(%L,id,trip_id,(select auth.uid())))',tab,tab);
    execute format('create trigger guard_privacy before insert or update on public.%I for each row execute function private.guard_privacy()',tab);
  end loop;
end $$;

create function private.is_trip_owner(tid uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.trips where id=tid and created_by=auth.uid()) $$;
revoke all on function private.is_trip_owner(uuid) from public;
grant execute on function private.is_trip_owner(uuid) to authenticated;

-- Owner can administer members. Ordinary members can only see themselves.
create policy owner_members_read on public.trip_members for select to authenticated using (private.is_trip_owner(trip_id));
create policy owner_members_update on public.trip_members for update to authenticated using (user_id<>(select auth.uid()) and private.is_trip_owner(trip_id)) with check (role in ('viewer','editor') and private.is_trip_owner(trip_id));
create policy owner_members_delete on public.trip_members for delete to authenticated using (user_id<>(select auth.uid()) and private.is_trip_owner(trip_id));
grant update(role),delete on public.trip_members to authenticated;

-- Owner-only shared-member preview, fetched from the server, includes tickets.
create function public.preview_shared_trip(p_trip_id uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb := '{}'::jsonb; tab text; rows jsonb;
begin
  if not exists(select 1 from public.trips where id=p_trip_id and created_by=auth.uid()) then raise exception 'Trip owner required'; end if;
  foreach tab in array array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets'] loop
    execute format('select coalesce(jsonb_agg(to_jsonb(r)-''private_user_ids''),''[]''::jsonb) from public.%I r where trip_id=$1 and private.record_visible(%L,id,trip_id,null)',tab,tab) into rows using p_trip_id;
    result := result || jsonb_build_object(tab,rows);
  end loop;
  return result;
end $$;
revoke all on function public.preview_shared_trip(uuid) from public,anon;
grant execute on function public.preview_shared_trip(uuid) to authenticated;
-- Public view keeps its explicit safe column projection; privacy predicates are
-- installed below from the inspected definition, never exposing raw tables.


create function private.shared_record(tab text,rid uuid,tid uuid) returns boolean language sql stable security definer set search_path='' as $$ select private.record_visible(tab,rid,tid,null) $$; revoke all on function private.shared_record(text,uuid,uuid) from public; grant execute on function private.shared_record(text,uuid,uuid) to anon,authenticated;
create or replace view public.shared_japan_2026 with (security_barrier=true) as  SELECT id,
    title,
    destination,
    start_date,
    end_date,
    timezone,
    jsonb_build_object('tasks', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'category', x.category, 'priority', x.priority, 'status', x.status, 'due_date', x.due_date)), '[]'::jsonb) AS "coalesce"
           FROM tasks x
          WHERE (x.trip_id = t.id) AND private.shared_record('tasks',x.id,x.trip_id)), 'trip_stops', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'location', x.location, 'starts_on', x.starts_on, 'ends_on', x.ends_on, 'accommodation_name', x.accommodation_name, 'status', x.status)), '[]'::jsonb) AS "coalesce"
           FROM trip_stops x
          WHERE (x.trip_id = t.id) AND private.shared_record('trip_stops',x.id,x.trip_id)), 'activities', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'activity_date', x.activity_date, 'type', x.type, 'location', x.location, 'status', x.status)), '[]'::jsonb) AS "coalesce"
           FROM activities x
          WHERE (x.trip_id = t.id) AND private.shared_record('activities',x.id,x.trip_id)), 'bookings', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'category', x.category, 'status', x.status, 'provider', x.provider, 'start_date', x.start_date, 'end_date', x.end_date)), '[]'::jsonb) AS "coalesce"
           FROM bookings x
          WHERE (x.trip_id = t.id) AND private.shared_record('bookings',x.id,x.trip_id)), 'decisions', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'subject', x.subject, 'outcome', x.outcome, 'status', x.status)), '[]'::jsonb) AS "coalesce"
           FROM decisions x
          WHERE (x.trip_id = t.id) AND private.shared_record('decisions',x.id,x.trip_id)), 'transport_legs', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'activity_date', x.activity_date, 'mode', x.mode, 'departure_name', x.departure_name, 'arrival_name', x.arrival_name, 'departs_at', x.departs_at, 'arrives_at', x.arrives_at, 'operator', x.operator, 'service_number', x.service_number, 'reservation_status', x.reservation_status)), '[]'::jsonb) AS "coalesce"
           FROM transport_legs x
          WHERE (x.trip_id = t.id) AND private.shared_record('transport_legs',x.id,x.trip_id))) AS data
   FROM trips t
  WHERE (id = '07487132-4d1e-4fd2-90b0-169495211ab3'::uuid);

create function private.member_directory(tid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$ begin if not private.is_trip_owner(tid) then raise exception 'Trip owner required';end if; return (select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'role',m.role,'email',u.email)),'[]'::jsonb) from public.trip_members m join auth.users u on u.id=m.user_id where m.trip_id=tid);end $$; revoke all on function private.member_directory(uuid) from public;grant execute on function private.member_directory(uuid) to authenticated;
create function public.trip_member_directory(p_trip_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.member_directory(p_trip_id) $$;revoke all on function public.trip_member_directory(uuid) from public,anon;grant execute on function public.trip_member_directory(uuid) to authenticated;
create function private.public_trip_projection() returns table(id uuid,title text,destination text,start_date date,end_date date,timezone text,data jsonb) language sql stable security definer set search_path='' as $projection$ SELECT id,
    title,
    destination,
    start_date,
    end_date,
    timezone,
    jsonb_build_object('tasks', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'category', x.category, 'priority', x.priority, 'status', x.status, 'due_date', x.due_date)), '[]'::jsonb) AS "coalesce"
           FROM public.tasks x
          WHERE (x.trip_id = t.id) AND private.shared_record('tasks',x.id,x.trip_id)), 'trip_stops', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'location', x.location, 'starts_on', x.starts_on, 'ends_on', x.ends_on, 'accommodation_name', x.accommodation_name, 'status', x.status)), '[]'::jsonb) AS "coalesce"
           FROM public.trip_stops x
          WHERE (x.trip_id = t.id) AND private.shared_record('trip_stops',x.id,x.trip_id)), 'activities', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'activity_date', x.activity_date, 'type', x.type, 'location', x.location, 'status', x.status)), '[]'::jsonb) AS "coalesce"
           FROM public.activities x
          WHERE (x.trip_id = t.id) AND private.shared_record('activities',x.id,x.trip_id)), 'bookings', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'category', x.category, 'status', x.status, 'provider', x.provider, 'start_date', x.start_date, 'end_date', x.end_date)), '[]'::jsonb) AS "coalesce"
           FROM public.bookings x
          WHERE (x.trip_id = t.id) AND private.shared_record('bookings',x.id,x.trip_id)), 'decisions', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'subject', x.subject, 'outcome', x.outcome, 'status', x.status)), '[]'::jsonb) AS "coalesce"
           FROM public.decisions x
          WHERE (x.trip_id = t.id) AND private.shared_record('decisions',x.id,x.trip_id)), 'transport_legs', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'activity_date', x.activity_date, 'mode', x.mode, 'departure_name', x.departure_name, 'arrival_name', x.arrival_name, 'departs_at', x.departs_at, 'arrives_at', x.arrives_at, 'operator', x.operator, 'service_number', x.service_number, 'reservation_status', x.reservation_status)), '[]'::jsonb) AS "coalesce"
           FROM public.transport_legs x
          WHERE (x.trip_id = t.id) AND private.shared_record('transport_legs',x.id,x.trip_id))) AS data
   FROM public.trips t
  WHERE (id = '07487132-4d1e-4fd2-90b0-169495211ab3'::uuid); $projection$; revoke all on function private.public_trip_projection() from public;grant execute on function private.public_trip_projection() to anon,authenticated;create or replace view public.shared_japan_2026 with (security_invoker=true,security_barrier=true) as select * from private.public_trip_projection();
