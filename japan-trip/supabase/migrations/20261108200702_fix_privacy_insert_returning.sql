-- INSERT ... RETURNING must authorise the new row directly. A stable helper
-- that re-queries the target table cannot see that row in the statement snapshot.
insert into private.privacy_backups(kind,payload)
select 'privacy_policies_before_insert_fix',to_jsonb(p) from pg_policies p
where schemaname='public' and policyname like 'privacy_%';

create function private.row_visible(tab text, r jsonb, actor uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare tid uuid; owner_id uuid; k text; parent text;
begin
  if tab is null or r is null or tab<>all(array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets']) then return false;end if;
  tid := (r->>'trip_id')::uuid;
  select created_by into owner_id from public.trips where id=tid;
  if owner_id is null then return false;end if;
  if actor is not null and actor<>owner_id and not exists(select 1 from public.trip_members where trip_id=tid and user_id=actor) then return false;end if;
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
grant execute on function private.row_visible(text,jsonb,uuid) to authenticated;

do $$ declare tab text; predicate text;begin
  foreach tab in array array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets'] loop
    predicate := format('private.row_visible(%L,to_jsonb(%I),(select auth.uid()))',tab,tab);
    execute format('alter policy privacy_read on public.%I using (%s)',tab,predicate);
    execute format('alter policy privacy_update on public.%I using (%s) with check (%s)',tab,predicate,predicate);
    execute format('alter policy privacy_delete on public.%I using (%s)',tab,predicate);
    execute format('create policy privacy_insert on public.%I as restrictive for insert to authenticated with check (%s)',tab,predicate);
  end loop;
end $$;
