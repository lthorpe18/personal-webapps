-- Public property URLs follow the existing record visibility and parent RLS.
insert into private.privacy_backups(kind,payload) select 'public_projection_before_listing_links',jsonb_build_object('definition',pg_get_functiondef('private.public_trip_projection()'::regprocedure));
alter table public.trip_stops add column listing_url text not null default '' check (listing_url='' or listing_url ~ '^https?://[^[:space:]]+$');
alter table public.bookings add column listing_url text not null default '' check (listing_url='' or listing_url ~ '^https?://[^[:space:]]+$');
CREATE OR REPLACE FUNCTION private.public_trip_projection()
 RETURNS TABLE(id uuid, title text, destination text, start_date date, end_date date, timezone text, data jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ SELECT id,
    title,
    destination,
    start_date,
    end_date,
    timezone,
    jsonb_build_object('tasks', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'category', x.category, 'priority', x.priority, 'status', x.status, 'due_date', x.due_date)), '[]'::jsonb) AS "coalesce"
           FROM public.tasks x
          WHERE (x.trip_id = t.id) AND private.shared_record('tasks',x.id,x.trip_id)), 'trip_stops', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'location', x.location, 'starts_on', x.starts_on, 'ends_on', x.ends_on, 'accommodation_name', x.accommodation_name, 'listing_url', x.listing_url, 'status', x.status)), '[]'::jsonb) AS "coalesce"
           FROM public.trip_stops x
          WHERE (x.trip_id = t.id) AND private.shared_record('trip_stops',x.id,x.trip_id)), 'activities', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'activity_date', x.activity_date, 'type', x.type, 'location', x.location, 'status', x.status)), '[]'::jsonb) AS "coalesce"
           FROM public.activities x
          WHERE (x.trip_id = t.id) AND private.shared_record('activities',x.id,x.trip_id)), 'bookings', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'category', x.category, 'status', x.status, 'provider', x.provider, 'start_date', x.start_date, 'end_date', x.end_date, 'listing_url', x.listing_url)), '[]'::jsonb) AS "coalesce"
           FROM public.bookings x
          WHERE (x.trip_id = t.id) AND private.shared_record('bookings',x.id,x.trip_id)), 'decisions', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'subject', x.subject, 'outcome', x.outcome, 'status', x.status)), '[]'::jsonb) AS "coalesce"
           FROM public.decisions x
          WHERE (x.trip_id = t.id) AND private.shared_record('decisions',x.id,x.trip_id)), 'transport_legs', ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'activity_date', x.activity_date, 'mode', x.mode, 'departure_name', x.departure_name, 'arrival_name', x.arrival_name, 'departs_at', x.departs_at, 'arrives_at', x.arrives_at, 'operator', x.operator, 'service_number', x.service_number, 'reservation_status', x.reservation_status)), '[]'::jsonb) AS "coalesce"
           FROM public.transport_legs x
          WHERE (x.trip_id = t.id) AND private.shared_record('transport_legs',x.id,x.trip_id))) AS data
   FROM public.trips t
  WHERE (id = '07487132-4d1e-4fd2-90b0-169495211ab3'::uuid); $function$
