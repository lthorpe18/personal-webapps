-- Additive: existing bookings and payment history remain untouched.
insert into private.privacy_backups(kind,payload)
select 'before_trip_costs_function',jsonb_build_object('signature',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid))
from pg_proc p where p.oid in ('private.row_visible(text,jsonb,uuid)'::regprocedure,'public.preview_shared_trip(uuid)'::regprocedure);

create function private.currency_digits(c text) returns integer language sql immutable set search_path='' as $$
select case when c in ('BIF','CLP','DJF','GNF','ISK','JPY','KMF','KRW','PYG','RWF','UGX','UYI','VND','VUV','XAF','XOF','XPF') then 0 when c in ('BHD','IQD','JOD','KWD','LYD','OMR','TND') then 3 else 2 end $$;
revoke all on function private.currency_digits(text) from public,anon;
grant execute on function private.currency_digits(text) to authenticated,service_role;
create function private.valid_cost_splits(splits jsonb,total numeric,currency text,payer text) returns boolean
language plpgsql immutable set search_path='' as $$
declare s jsonb; names text[]:=array[lower(btrim(payer))]; allocated numeric:=0; share numeric; repaid numeric; person text; precision integer:=private.currency_digits(currency);
begin
  if jsonb_typeof(splits)<>'array' or jsonb_array_length(splits)>30 then return false;end if;
  for s in select value from jsonb_array_elements(splits) loop
    if jsonb_typeof(s)<>'object' or jsonb_typeof(s->'person') is distinct from 'string' or jsonb_typeof(s->'share') is distinct from 'number' or jsonb_typeof(s->'repaid') is distinct from 'number' then return false;end if;
    person:=btrim(s->>'person'); share:=(s->>'share')::numeric;repaid:=(s->>'repaid')::numeric;
    if person='' or length(person)>100 or lower(person)=any(names) or share<0 or share>total or repaid<0 or repaid>share or share<>round(share,precision) or repaid<>round(repaid,precision) then return false;end if;
    names:=array_append(names,lower(person));allocated:=allocated+share;
  end loop;
  return allocated<=total;
exception when others then return false;
end $$;
revoke all on function private.valid_cost_splits(jsonb,numeric,text,text) from public,anon;
grant execute on function private.valid_cost_splits(jsonb,numeric,text,text) to authenticated,service_role;

create table public.trip_expenses(
 id uuid primary key default gen_random_uuid(),
 trip_id uuid not null references public.trips(id) on delete cascade,
 booking_id uuid references public.bookings(id) on delete restrict,
 title text not null check(length(btrim(title)) between 1 and 300),
 amount numeric(14,3) not null check(amount>=0 and amount<100000000000),
 currency text not null default 'GBP' check(currency ~ '^[A-Z]{3}$'),
 paid_by text not null default 'Me' check(length(btrim(paid_by)) between 1 and 100),
 vendor_paid numeric(14,3) check(vendor_paid>=0 and vendor_paid<=amount),
 due_date date, notes text,
 splits jsonb not null default '[]'::jsonb,
 visibility text not null default 'shared' check(visibility in ('shared','private')),
 private_user_ids uuid[] not null default '{}',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(amount=round(amount,private.currency_digits(currency))),
 check(vendor_paid=round(vendor_paid,private.currency_digits(currency))),
 check(private.valid_cost_splits(splits,amount,currency,paid_by))
);
create index trip_expenses_trip_idx on public.trip_expenses(trip_id);
create unique index trip_expenses_booking_idx on public.trip_expenses(booking_id) where booking_id is not null;
alter table public.trip_expenses enable row level security;
revoke all on public.trip_expenses from public,anon,authenticated;
grant select,insert,update,delete on public.trip_expenses to authenticated;
grant all on public.trip_expenses to service_role;
create trigger guard_privacy before insert or update on public.trip_expenses for each row execute function private.guard_privacy();
create trigger prevent_expense_trip_change before update on public.trip_expenses for each row execute function private.prevent_trip_reassignment();
create trigger update_trip_expenses before update on public.trip_expenses for each row execute function private.set_updated_at();
create function private.guard_expense_link() returns trigger language plpgsql set search_path='' as $$
begin
 if new.booking_id is distinct from old.booking_id and not private.is_trip_owner(old.trip_id) then raise exception 'Only the trip owner can change a cost booking link';end if;
 return new;
end $$;
revoke all on function private.guard_expense_link() from public,anon;
create trigger guard_expense_link before update on public.trip_expenses for each row execute function private.guard_expense_link();

create policy expense_read on public.trip_expenses for select to authenticated using(
 exists(select 1 from public.trip_members m where m.trip_id=trip_expenses.trip_id and m.user_id=(select auth.uid())));
create policy expense_insert on public.trip_expenses for insert to authenticated with check(
 exists(select 1 from public.trip_members m where m.trip_id=trip_expenses.trip_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create policy expense_update on public.trip_expenses for update to authenticated using(
 exists(select 1 from public.trip_members m where m.trip_id=trip_expenses.trip_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor'))) with check(
 exists(select 1 from public.trip_members m where m.trip_id=trip_expenses.trip_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create policy expense_delete on public.trip_expenses for delete to authenticated using(
 exists(select 1 from public.trip_members m where m.trip_id=trip_expenses.trip_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor')));

create or replace function private.row_visible(tab text, r jsonb, actor uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare tid uuid; owner_id uuid; k text; parent text;
begin
  if tab is null or r is null or tab<>all(array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets','trip_expenses']) then return false;end if;
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

create policy privacy_select on public.trip_expenses as restrictive for select to authenticated using (private.row_visible('trip_expenses',to_jsonb(trip_expenses),(select auth.uid())));
create policy privacy_insert on public.trip_expenses as restrictive for insert to authenticated with check (private.row_visible('trip_expenses',to_jsonb(trip_expenses),(select auth.uid())));
create policy privacy_update on public.trip_expenses as restrictive for update to authenticated using (private.row_visible('trip_expenses',to_jsonb(trip_expenses),(select auth.uid()))) with check (private.row_visible('trip_expenses',to_jsonb(trip_expenses),(select auth.uid())));
create policy privacy_delete on public.trip_expenses as restrictive for delete to authenticated using (private.row_visible('trip_expenses',to_jsonb(trip_expenses),(select auth.uid())));

create or replace function public.preview_shared_trip(p_trip_id uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb := '{}'::jsonb; tab text; rows jsonb;
begin
  if not exists(select 1 from public.trips where id=p_trip_id and created_by=auth.uid()) then raise exception 'Trip owner required'; end if;
  foreach tab in array array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets','trip_expenses'] loop
    execute format('select coalesce(jsonb_agg(to_jsonb(r)-''private_user_ids''),''[]''::jsonb) from public.%I r where trip_id=$1 and private.row_visible(%L,to_jsonb(r),null)',tab,tab) into rows using p_trip_id;
    result := result || jsonb_build_object(tab,rows);
  end loop;
  return result;
end $$;
revoke all on function public.preview_shared_trip(uuid) from public,anon;
grant execute on function public.preview_shared_trip(uuid) to authenticated;

-- No cost data is exposed through public projections or itinerary exports.
