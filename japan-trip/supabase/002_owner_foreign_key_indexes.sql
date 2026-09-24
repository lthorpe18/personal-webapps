-- Cover foreign keys used when deleting an owner or checking invitations.
create index if not exists trips_created_by_idx on public.trips(created_by);
create index if not exists trip_invitations_created_by_idx on public.trip_invitations(created_by);
