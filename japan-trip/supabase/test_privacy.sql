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
select set_config('request.jwt.claim.sub',current_setting('privacy.viewer'),true);
do $$ declare tab text; n integer; begin
  foreach tab in array array['trip_stops','tasks','activities','bookings','decisions','transport_legs','trip_assets'] loop
    execute format('select count(*) from public.%I where trip_id=$1',tab) into n using current_setting('privacy.trip')::uuid;
    if n<>1 then raise exception 'Viewer leak or shared access failure: % = %',tab,n; end if;
  end loop;
  begin perform public.trip_member_directory(current_setting('privacy.trip')::uuid);raise exception 'Directory allowed viewer';exception when raise_exception then if sqlerrm='Directory allowed viewer' then raise;end if;end;
  update public.tasks set title='Not allowed' where trip_id=current_setting('privacy.trip')::uuid;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Viewer edited a record'; end if;
  begin perform public.preview_shared_trip(current_setting('privacy.trip')::uuid);raise exception 'Preview allowed viewer';exception when raise_exception then if sqlerrm='Preview allowed viewer' then raise; end if;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy.editor'),true);
do $$ declare n integer; begin
  update public.tasks set title='Editor updated' where trip_id=current_setting('privacy.trip')::uuid;
  get diagnostics n=row_count;if n<>1 then raise exception 'Editor update failed';end if;
  begin update public.tasks set visibility='private' where trip_id=current_setting('privacy.trip')::uuid;raise exception 'Privacy escalation allowed';exception when raise_exception then if sqlerrm='Privacy escalation allowed' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy.outsider'),true);
do $$ begin if exists(select 1 from public.tasks where trip_id=current_setting('privacy.trip')::uuid) then raise exception 'Outsider can read';end if;end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy.owner'),true);
do $$ begin
  if jsonb_array_length(public.trip_member_directory(current_setting('privacy.trip')::uuid))<>3 then raise exception 'Owner directory failed';end if;
  if (select count(*) from public.trip_assets where trip_id=current_setting('privacy.trip')::uuid)<>3 then raise exception 'Owner lost attachments';end if;
  if jsonb_array_length(public.preview_shared_trip(current_setting('privacy.trip')::uuid)->'trip_assets')<>1 then raise exception 'Preview leaked attachment';end if;
  update public.tasks set private_user_ids=array[current_setting('privacy.viewer')::uuid] where trip_id=current_setting('privacy.trip')::uuid and visibility='private';
end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy.viewer'),true);
do $$ begin if (select count(*) from public.tasks where trip_id=current_setting('privacy.trip')::uuid)<>2 then raise exception 'Explicit grant failed';end if;end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy.owner'),true);
update public.tasks set private_user_ids='{}' where trip_id=current_setting('privacy.trip')::uuid and visibility='private';
select set_config('request.jwt.claim.sub',current_setting('privacy.viewer'),true);
do $$ begin if (select count(*) from public.tasks where trip_id=current_setting('privacy.trip')::uuid)<>1 then raise exception 'Grant revocation failed';end if;end $$;
reset role;
reset role;
set local role anon;
do $$ begin
  if not exists(select 1 from public.shared_japan_2026) then raise exception 'Public projection unavailable';end if;
  begin perform 1 from public.tasks;raise exception 'Anon raw access';exception when insufficient_privilege then null;end;
end $$;
select 'PASS: owner, viewer, editor, outsider, explicit grants/revocation, linked attachments, preview, public projection and raw API denial' as result;
rollback;
