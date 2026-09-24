-- Trip Planner v1: apply to a NEW, dedicated Supabase project only.
-- No personal itinerary data, addresses, booking references or API secrets here.
-- Run once as a migration. Use the publishable key in the frontend; NEVER service_role.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null check(length(trim(title)) between 1 and 160),
  destination text not null default '',
  start_date date not null,
  end_date date not null check(end_date >= start_date),
  timezone text not null default 'UTC',
  currency text not null default 'GBP' check(length(currency) between 3 and 8),
  notes text not null default '',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check(role in ('owner','editor','viewer')),
  joined_at timestamptz not null default now(),
  primary key(trip_id,user_id)
);
create index trip_members_by_user on public.trip_members(user_id,trip_id);

create table public.trip_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  email text not null check(email=lower(trim(email)) and position('@' in email)>1),
  role text not null check(role in ('editor','viewer')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  accepted_at timestamptz,
  unique(trip_id,email)
);
create index trip_invitations_email_pending on public.trip_invitations(email) where accepted_at is null;

create table public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  location text not null check(length(trim(location)) between 1 and 180),
  starts_on date not null,
  ends_on date not null check(ends_on > starts_on),
  accommodation_name text not null default '',
  status text not null default 'planned' check(status in ('planned','shortlisted','booked','cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trip_stops_by_trip on public.trip_stops(trip_id,starts_on);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check(length(trim(title)) between 1 and 240),
  category text not null default 'General',
  priority smallint not null default 2 check(priority between 1 and 3),
  status text not null default 'todo' check(status in ('todo','doing','blocked','done')),
  due_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_by_trip_status on public.tasks(trip_id,status,priority);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check(length(trim(title)) between 1 and 240),
  activity_date date,
  type text not null default 'sightseeing' check(type in ('sightseeing','theme_park','transport','meal','other')),
  location text not null default '',
  status text not null default 'planned' check(status in ('planned','booked','done','dropped')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index activities_by_trip_date on public.activities(trip_id,activity_date);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check(length(trim(title)) between 1 and 240),
  category text not null default 'other' check(category in ('flight','accommodation','transport','activity','parking','insurance','other')),
  status text not null default 'pending' check(status in ('pending','booked','cancelled')),
  provider text not null default '',
  start_date date,
  end_date date check(end_date is null or start_date is null or end_date>=start_date),
  amount numeric(12,2) check(amount is null or amount>=0),
  currency text not null default 'GBP',
  booking_reference text not null default '',
  confirmation_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_by_trip on public.bookings(trip_id,start_date);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  subject text not null check(length(trim(subject)) between 1 and 240),
  outcome text not null default '',
  status text not null default 'open' check(status in ('open','confirmed','dropped')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index decisions_by_trip on public.decisions(trip_id,status);

create function private.set_updated_at()
returns trigger language plpgsql set search_path='' as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

create trigger update_trips before update on public.trips
for each row execute function private.set_updated_at();
create trigger update_trip_stops before update on public.trip_stops
for each row execute function private.set_updated_at();
create trigger update_tasks before update on public.tasks
for each row execute function private.set_updated_at();
create trigger update_activities before update on public.activities
for each row execute function private.set_updated_at();
create trigger update_bookings before update on public.bookings
for each row execute function private.set_updated_at();
create trigger update_decisions before update on public.decisions
for each row execute function private.set_updated_at();

-- Keep each row attached to the trip it was created for, even when a member
-- has edit access to more than one trip.
create function private.prevent_trip_reassignment()
returns trigger language plpgsql set search_path='' as $
begin
  if new.trip_id is distinct from old.trip_id then
    raise exception 'Cannot move records between trips';
  end if;
  return new;
end;
$;
create trigger prevent_stop_trip_change before update on public.trip_stops
for each row execute function private.prevent_trip_reassignment();
create trigger prevent_task_trip_change before update on public.tasks
for each row execute function private.prevent_trip_reassignment();
create trigger prevent_activity_trip_change before update on public.activities
for each row execute function private.prevent_trip_reassignment();
create trigger prevent_booking_trip_change before update on public.bookings
for each row execute function private.prevent_trip_reassignment();
create trigger prevent_decision_trip_change before update on public.decisions
for each row execute function private.prevent_trip_reassignment();
create trigger prevent_invitation_trip_change before update on public.trip_invitations
for each row execute function private.prevent_trip_reassignment();

-- Insertion of a trip atomically creates its owner's membership.
-- Only a verified auth.uid() may own a newly inserted trip (RLS below).
create function private.ensure_owner_membership()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.trip_members(trip_id,user_id,role) values(new.id,new.created_by,'owner');
  return new;
end;
$$;
create trigger add_trip_owner after insert on public.trips
for each row execute function private.ensure_owner_membership();

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invitations enable row level security;
alter table public.trip_stops enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;
alter table public.bookings enable row level security;
alter table public.decisions enable row level security;

-- A member can read only their OWN membership row. This prevents recursive RLS
-- between trips and trip_members; the owner sees invitation rows separately.
create policy trip_members_own_read on public.trip_members
for select to authenticated using(user_id=(select auth.uid()));

create policy trips_member_read on public.trips for select to authenticated
using(
  created_by=(select auth.uid()) or exists(
    select 1 from public.trip_members m
    where m.trip_id=id and m.user_id=(select auth.uid())
  )
);
create policy trips_owner_insert on public.trips for insert to authenticated
with check(created_by=(select auth.uid()));
create policy trips_owner_update on public.trips for update to authenticated
using(created_by=(select auth.uid()))
with check(created_by=(select auth.uid()));
create policy trips_owner_delete on public.trips for delete to authenticated
using(created_by=(select auth.uid()));

create policy invitations_owner_read on public.trip_invitations for select to authenticated
using(exists(select 1 from public.trips t where t.id=trip_id and t.created_by=(select auth.uid())));
create policy invitations_owner_insert on public.trip_invitations for insert to authenticated
with check(
  created_by=(select auth.uid()) and
  exists(select 1 from public.trips t where t.id=trip_id and t.created_by=(select auth.uid()))
);
create policy invitations_owner_update on public.trip_invitations for update to authenticated
using(exists(select 1 from public.trips t where t.id=trip_id and t.created_by=(select auth.uid())))
with check(
  created_by=(select auth.uid()) and
  exists(select 1 from public.trips t where t.id=trip_id and t.created_by=(select auth.uid()))
);
create policy invitations_owner_delete on public.trip_invitations for delete to authenticated
using(exists(select 1 from public.trips t where t.id=trip_id and t.created_by=(select auth.uid())));

-- All trip contents share the same simple membership rule. Owners/editors can
-- write; viewers can only read. A user cannot reassign a record to another trip.
do $policies$
declare tbl text;
begin
  foreach tbl in array array['trip_stops','tasks','activities','bookings','decisions'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using(
        exists(select 1 from public.trip_members m where m.trip_id=public.%I.trip_id and m.user_id=(select auth.uid()))
      )',tbl||'_member_read',tbl,tbl
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check(
        exists(select 1 from public.trip_members m where m.trip_id=public.%I.trip_id and m.user_id=(select auth.uid()) and m.role in (''owner'',''editor''))
      )',tbl||'_member_insert',tbl,tbl
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using(
        exists(select 1 from public.trip_members m where m.trip_id=public.%I.trip_id and m.user_id=(select auth.uid()) and m.role in (''owner'',''editor''))
      ) with check(
        exists(select 1 from public.trip_members m where m.trip_id=public.%I.trip_id and m.user_id=(select auth.uid()) and m.role in (''owner'',''editor''))
      )',tbl||'_member_update',tbl,tbl,tbl
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using(
        exists(select 1 from public.trip_members m where m.trip_id=public.%I.trip_id and m.user_id=(select auth.uid()) and m.role in (''owner'',''editor''))
      )',tbl||'_member_delete',tbl,tbl
    );
  end loop;
end;
$policies$;

-- The ONLY privileged client-callable function: claim invitations for the
-- caller's VERIFIED email. The caller cannot supply a user ID or an email.
-- An attacker with a public publishable key cannot read someone else's invites.
create function public.claim_trip_invitations()
returns integer language plpgsql security definer set search_path='' as $$
declare
  caller uuid := auth.uid();
  verified_email text;
  joined_count integer;
begin
  if caller is null then raise exception 'Sign in required'; end if;
  select lower(u.email) into verified_email
  from auth.users u where u.id=caller and u.email_confirmed_at is not null;
  if verified_email is null then raise exception 'Verified email required'; end if;

  with claimed as (
    update public.trip_invitations i
      set accepted_at=now()
      where i.email=verified_email and i.accepted_at is null and i.expires_at>now()
      returning i.trip_id,i.role
  )
  insert into public.trip_members(trip_id,user_id,role)
  select c.trip_id,caller,c.role from claimed c
  on conflict(trip_id,user_id) do nothing;
  get diagnostics joined_count=row_count;
  return joined_count;
end;
$$;

-- Restrict function execution, even though it includes its own caller check.
revoke all on function public.claim_trip_invitations() from public, anon;
grant execute on function public.claim_trip_invitations() to authenticated;
revoke all on function private.ensure_owner_membership() from public, anon, authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.prevent_trip_reassignment() from public, anon, authenticated;

-- RLS is necessary but not sufficient: Data API permissions are also explicit.
revoke all on public.trips,public.trip_members,public.trip_invitations,
  public.trip_stops,public.tasks,public.activities,public.bookings,public.decisions from public,anon;
grant select,insert,update,delete on public.trips to authenticated;
grant select on public.trip_members to authenticated;
grant select,insert,update,delete on public.trip_invitations to authenticated;
grant select,insert,update,delete on public.trip_stops,public.tasks,
  public.activities,public.bookings,public.decisions to authenticated;

-- Enable filtered Postgres Changes on trip data if the publication exists.
do $realtime$
declare tbl text;
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    foreach tbl in array array['trip_stops','tasks','activities','bookings','decisions','trip_invitations'] loop
      if not exists(
        select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename=tbl
      ) then
        execute format('alter publication supabase_realtime add table public.%I',tbl);
      end if;
    end loop;
  end if;
end;
$realtime$;

commit;
