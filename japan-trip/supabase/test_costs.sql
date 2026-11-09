-- Run via an administrative SQL connection. Entire fixture is rolled back.
begin;
select set_config('privacy.owner', (select created_by::text from public.trips limit 1), true);
select set_config('privacy.viewer', gen_random_uuid()::text, true);
select set_config('privacy.editor', gen_random_uuid()::text, true);
select set_config('privacy.outsider', gen_random_uuid()::text, true);
select set_config('privacy.trip', gen_random_uuid()::text, true);
insert into auth.users(id,email) select current_setting('privacy.viewer')::uuid,'privacy-viewer@example.invalid'
union all select current_setting('privacy.editor')::uuid,'privacy-editor@example.invalid'
union all select current_setting('privacy.outsider')::uuid,'privacy-outsider@example.invalid';
insert into public.trips(id,title,start_date,end_date,created_by) values(current_setting('privacy.trip')::uuid,'Privacy test',current_date,current_date+1,current_setting('privacy.owner')::uuid);
insert into public.trip_members(trip_id,user_id,role) values
(current_setting('privacy.trip')::uuid,current_setting('privacy.viewer')::uuid,'viewer'),
(current_setting('privacy.trip')::uuid,current_setting('privacy.editor')::uuid,'editor');
do $$ declare tab text; begin
  insert into public.trip_stops(trip_id,location,starts_on,ends_on,visibility) values(current_setting('privacy.trip')::uuid,'Shared',current_date,current_date+1,'shared'),(current_setting('privacy.trip')::uuid,'Secret',current_date,current_date+1,'private');
  foreach tab in array array['tasks','activities','bookings'] loop
    execute format('insert into public.%I(trip_id,title,visibility) values($1,''Shared'',''shared''),($1,''Secret'',''private'')',tab) using current_setting('privacy.trip')::uuid;
  end loop;
  insert into public.decisions(trip_id,subject,outcome,visibility) values(current_setting('privacy.trip')::uuid,'Shared','Shared','shared'),(current_setting('privacy.trip')::uuid,'Secret','Secret','private');
  insert into public.transport_legs(trip_id,activity_date,departure_name,arrival_name,visibility) values(current_setting('privacy.trip')::uuid,current_date,'Shared','Shared','shared'),(current_setting('privacy.trip')::uuid,current_date,'Secret','Secret','private');
  insert into public.trip_assets(trip_id,title,kind,mime_type,data_url,visibility,booking_id) select trip_id,'Shared','document','text/plain','shared','shared',id from public.bookings where trip_id=current_setting('privacy.trip')::uuid and visibility='shared';
  insert into public.trip_assets(trip_id,title,kind,mime_type,data_url,visibility,booking_id) select trip_id,'Secret','document','text/plain','secret','private',id from public.bookings where trip_id=current_setting('privacy.trip')::uuid and visibility='shared';
  insert into public.trip_assets(trip_id,title,kind,mime_type,data_url,booking_id) select trip_id,'Inherited','document','text/plain','secret',id from public.bookings where trip_id=current_setting('privacy.trip')::uuid and visibility='private';
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('privacy.owner'),true);
do $$ declare rid uuid;n integer;begin
 insert into public.trip_expenses(trip_id,title,amount,currency,vendor_paid,splits) values(current_setting('privacy.trip')::uuid,'Shared cost',100,'GBP',30,'[{"person":"Hannah","share":20,"repaid":5}]') returning id into rid;
 if rid is null then raise exception 'Owner insert returning failed';end if;
 update public.trip_expenses set vendor_paid=100,splits='[{"person":"Hannah","share":20,"repaid":20}]' where id=rid returning id into rid;
 if rid is null then raise exception 'Owner payment update returning failed';end if;
 insert into public.trip_expenses(trip_id,title,amount,visibility) values(current_setting('privacy.trip')::uuid,'Private cost',100,'private');
 insert into public.trip_expenses(trip_id,title,amount,booking_id) select trip_id,'Inherited secret cost',100,id from public.bookings where trip_id=current_setting('privacy.trip')::uuid and visibility='private';
 if jsonb_array_length(public.preview_shared_trip(current_setting('privacy.trip')::uuid)->'trip_expenses')<>1 then raise exception 'Preview cost leak';end if;
 begin insert into public.trip_expenses(trip_id,title,amount,vendor_paid) values(current_setting('privacy.trip')::uuid,'Invalid overpayment',10,20);raise exception 'Allowed overpayment';exception when check_violation then null;end;
 begin insert into public.trip_expenses(trip_id,title,amount,splits) values(current_setting('privacy.trip')::uuid,'Invalid split',10,'[{"person":"Hannah","share":20,"repaid":0}]');raise exception 'Allowed over-allocation';exception when check_violation then null;end;
 begin insert into public.trip_expenses(trip_id,title,amount,splits) values(current_setting('privacy.trip')::uuid,'Invalid repayment',100,'[{"person":"Hannah","share":20,"repaid":21}]');raise exception 'Allowed excess repayment';exception when check_violation then null;end;
 begin insert into public.trip_expenses(trip_id,title,amount,currency) values(current_setting('privacy.trip')::uuid,'Invalid yen',1.5,'JPY');raise exception 'Allowed fractional yen';exception when check_violation then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy.viewer'),true);
do $$ declare n integer;begin
 if (select count(*) from public.trip_expenses where trip_id=current_setting('privacy.trip')::uuid)<>1 then raise exception 'Viewer cost leak';end if;
 update public.trip_expenses set vendor_paid=0 where trip_id=current_setting('privacy.trip')::uuid;get diagnostics n=row_count;if n<>0 then raise exception 'Viewer wrote cost';end if;
 begin insert into public.trip_expenses(trip_id,title,amount) values(current_setting('privacy.trip')::uuid,'Viewer insert',10);raise exception 'Viewer insert allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy.editor'),true);
do $$ declare n integer;begin
 update public.trip_expenses set vendor_paid=90 where trip_id=current_setting('privacy.trip')::uuid returning 1 into n;if n<>1 then raise exception 'Editor update failed';end if;
 begin update public.trip_expenses set visibility='private' where trip_id=current_setting('privacy.trip')::uuid;raise exception 'Editor privacy escalation';exception when raise_exception then if sqlerrm='Editor privacy escalation' then raise;end if;end;
 insert into public.trip_expenses(trip_id,title,amount) values(current_setting('privacy.trip')::uuid,'Editor shared insert',12);
end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy.outsider'),true);
do $$ begin if exists(select 1 from public.trip_expenses where trip_id=current_setting('privacy.trip')::uuid) then raise exception 'Outsider cost access';end if;end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy.owner'),true);
update public.trip_expenses set private_user_ids=array[current_setting('privacy.viewer')::uuid] where trip_id=current_setting('privacy.trip')::uuid and title in ('Private cost','Inherited secret cost');
select set_config('request.jwt.claim.sub',current_setting('privacy.viewer'),true);
do $$ begin if (select count(*) from public.trip_expenses where trip_id=current_setting('privacy.trip')::uuid)<>3 then raise exception 'Grant or linked-parent denial failed';end if;end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy.owner'),true);
update public.trip_expenses set private_user_ids='{}' where trip_id=current_setting('privacy.trip')::uuid;
select set_config('request.jwt.claim.sub',current_setting('privacy.viewer'),true);
do $$ begin if (select count(*) from public.trip_expenses where trip_id=current_setting('privacy.trip')::uuid)<>2 then raise exception 'Revocation failed';end if;end $$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.trip_expenses;raise exception 'Anonymous finance access';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.shared_japan_2026 where data ? 'trip_expenses') then raise exception 'Public cost leak';end if;
end $$;
select 'PASS: owner/editor writes + RETURNING; viewer/outsider/anonymous denial; private and linked-private costs; grants/revocation; server preview; overpayment/over-allocation/currency precision constraints. All fixtures rolled back.' as result;
rollback;
