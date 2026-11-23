-- Saved reminders: photos, text and links kept with a trip.
-- Images are client-compressed JPEG data URLs (max 2.5 MB) so the feature works
-- without introducing a second storage/auth layer.

create table if not exists public.trip_reminders(
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check(length(btrim(title)) between 1 and 240),
  category text not null default 'General' check(length(btrim(category)) between 1 and 80),
  notes text not null default '' check(length(notes)<=5000),
  link_url text not null default '' check(link_url='' or link_url ~ '^https?://'),
  image_data_url text not null default '' check(image_data_url='' or (image_data_url like 'data:image/jpeg;base64,%' and length(image_data_url)<=2500000)),
  status text not null default 'active' check(status in ('active','done')),
  sort_order smallint not null default 0,
  visibility text not null default 'shared' check(visibility in ('shared','private')),
  private_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trip_reminders_trip_idx on public.trip_reminders(trip_id,status,sort_order,created_at desc);
alter table public.trip_reminders enable row level security;
revoke all on public.trip_reminders from public,anon,authenticated;
grant select,insert,update,delete on public.trip_reminders to authenticated;
grant all on public.trip_reminders to service_role;

drop trigger if exists guard_privacy on public.trip_reminders;
create trigger guard_privacy before insert or update on public.trip_reminders for each row execute function private.guard_privacy();
drop trigger if exists prevent_reminder_trip_change on public.trip_reminders;
create trigger prevent_reminder_trip_change before update on public.trip_reminders for each row execute function private.prevent_trip_reassignment();
drop trigger if exists update_trip_reminders on public.trip_reminders;
create trigger update_trip_reminders before update on public.trip_reminders for each row execute function private.set_updated_at();

drop policy if exists reminder_member_read on public.trip_reminders;
create policy reminder_member_read on public.trip_reminders for select to authenticated using(
  exists(select 1 from public.trip_members m where m.trip_id=trip_reminders.trip_id and m.user_id=(select auth.uid()))
);
drop policy if exists reminder_member_insert on public.trip_reminders;
create policy reminder_member_insert on public.trip_reminders for insert to authenticated with check(
  exists(select 1 from public.trip_members m where m.trip_id=trip_reminders.trip_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor'))
);
drop policy if exists reminder_member_update on public.trip_reminders;
create policy reminder_member_update on public.trip_reminders for update to authenticated using(
  exists(select 1 from public.trip_members m where m.trip_id=trip_reminders.trip_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor'))
) with check(
  exists(select 1 from public.trip_members m where m.trip_id=trip_reminders.trip_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor'))
);
drop policy if exists reminder_member_delete on public.trip_reminders;
create policy reminder_member_delete on public.trip_reminders for delete to authenticated using(
  exists(select 1 from public.trip_members m where m.trip_id=trip_reminders.trip_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor'))
);

create or replace function private.record_visible(tab text, rid uuid, tid uuid, actor uuid, path text[] default '{}')
returns boolean language plpgsql stable security definer set search_path='' as $$
declare r jsonb; k text; parent text; owner_id uuid; token text := tab||':'||rid::text;
begin
  if tab <> all(array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets','trip_reminders']) or token=any(path) or cardinality(path)>12 then return false; end if;
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

create or replace function private.row_visible(tab text, r jsonb, actor uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare tid uuid; owner_id uuid; k text; parent text;
begin
  if tab is null or r is null or tab<>all(array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets','trip_expenses','trip_reminders']) then return false;end if;
  tid := (r->>'trip_id')::uuid;
  select created_by into owner_id from public.trips where id=tid;
  if owner_id is null then return false;end if;
  if actor is not null and actor<>owner_id and not exists(select 1 from public.trip_members m where m.trip_id=tid and m.user_id=actor) then return false;end if;
  if r->>'visibility' not in ('shared','private') or r->>'visibility' is null then return false;end if;
  if r->>'visibility'='private' and (actor is null or (actor<>owner_id and not (r->'private_user_ids' @> to_jsonb(array[actor])))) then return false;end if;
  foreach k in array array['stop_id','booking_id','activity_id','transport_leg_id'] loop
    if r->>k is not null then
      parent := case k when 'stop_id' then 'trip_stops' when 'booking_id' then 'bookings' when 'activity_id' then 'activities' else 'transport_legs' end;
      if not private.record_visible(parent,(r->>k)::uuid,tid,actor,array[tab||':'||(r->>'id')]) then return false;end if;
    end if;
  end loop;
  return true;
end $$;
revoke all on function private.row_visible(text,jsonb,uuid) from public,anon;
grant execute on function private.row_visible(text,jsonb,uuid) to authenticated,service_role;

drop policy if exists privacy_select on public.trip_reminders;
create policy privacy_select on public.trip_reminders as restrictive for select to authenticated using (private.row_visible('trip_reminders',to_jsonb(trip_reminders),(select auth.uid())));
drop policy if exists privacy_insert on public.trip_reminders;
create policy privacy_insert on public.trip_reminders as restrictive for insert to authenticated with check (private.row_visible('trip_reminders',to_jsonb(trip_reminders),(select auth.uid())));
drop policy if exists privacy_update on public.trip_reminders;
create policy privacy_update on public.trip_reminders as restrictive for update to authenticated using (private.row_visible('trip_reminders',to_jsonb(trip_reminders),(select auth.uid()))) with check (private.row_visible('trip_reminders',to_jsonb(trip_reminders),(select auth.uid())));
drop policy if exists privacy_delete on public.trip_reminders;
create policy privacy_delete on public.trip_reminders as restrictive for delete to authenticated using (private.row_visible('trip_reminders',to_jsonb(trip_reminders),(select auth.uid())));

create or replace function public.preview_shared_trip(p_trip_id uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb := '{}'::jsonb; tab text; rows jsonb;
begin
  if not exists(select 1 from public.trips where id=p_trip_id and created_by=auth.uid()) then raise exception 'Trip owner required'; end if;
  foreach tab in array array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets','trip_expenses','trip_reminders'] loop
    execute format('select coalesce(jsonb_agg(to_jsonb(r)-''private_user_ids''),''[]''::jsonb) from public.%I r where trip_id=$1 and private.row_visible(%L,to_jsonb(r),null)',tab,tab) into rows using p_trip_id;
    result := result || jsonb_build_object(tab,rows);
  end loop;
  return result;
end $$;
revoke all on function public.preview_shared_trip(uuid) from public,anon;
grant execute on function public.preview_shared_trip(uuid) to authenticated;

do $realtime$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='trip_reminders'
  ) then alter publication supabase_realtime add table public.trip_reminders; end if;
end
$realtime$;

create or replace function private.public_trip_projection()
returns table(id uuid,title text,destination text,start_date date,end_date date,timezone text,data jsonb)
language sql stable security definer set search_path='' as $projection$
select t.id,t.title,t.destination,t.start_date,t.end_date,t.timezone,
jsonb_build_object(
 'tasks',(select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'category',x.category,'priority',x.priority,'status',x.status,'due_date',x.due_date)),'[]'::jsonb) from public.tasks x where x.trip_id=t.id and private.shared_record('tasks',x.id,x.trip_id)),
 'trip_stops',(select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'location',x.location,'starts_on',x.starts_on,'ends_on',x.ends_on,'accommodation_name',x.accommodation_name,'listing_url',x.listing_url,'status',x.status)),'[]'::jsonb) from public.trip_stops x where x.trip_id=t.id and private.shared_record('trip_stops',x.id,x.trip_id)),
 'activities',(select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'activity_date',x.activity_date,'type',x.type,'location',x.location,'status',x.status)),'[]'::jsonb) from public.activities x where x.trip_id=t.id and private.shared_record('activities',x.id,x.trip_id)),
 'bookings',(select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'category',x.category,'status',x.status,'provider',x.provider,'start_date',x.start_date,'end_date',x.end_date,'listing_url',x.listing_url)),'[]'::jsonb) from public.bookings x where x.trip_id=t.id and private.shared_record('bookings',x.id,x.trip_id)),
 'decisions',(select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'subject',x.subject,'outcome',x.outcome,'status',x.status)),'[]'::jsonb) from public.decisions x where x.trip_id=t.id and private.shared_record('decisions',x.id,x.trip_id)),
 'transport_legs',(select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'activity_date',x.activity_date,'mode',x.mode,'departure_name',x.departure_name,'arrival_name',x.arrival_name,'departs_at',x.departs_at,'arrives_at',x.arrives_at,'operator',x.operator,'service_number',x.service_number,'reservation_status',x.reservation_status)),'[]'::jsonb) from public.transport_legs x where x.trip_id=t.id and private.shared_record('transport_legs',x.id,x.trip_id)),
 'trip_reminders',(select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'category',x.category,'notes',x.notes,'link_url',x.link_url,'image_data_url',x.image_data_url,'status',x.status,'sort_order',x.sort_order) order by x.status,x.sort_order,x.created_at desc),'[]'::jsonb) from public.trip_reminders x where x.trip_id=t.id and private.shared_record('trip_reminders',x.id,x.trip_id))
) as data
from public.trips t
where t.id='07487132-4d1e-4fd2-90b0-169495211ab3'::uuid
$projection$;
revoke all on function private.public_trip_projection() from public;
grant execute on function private.public_trip_projection() to anon,authenticated;
