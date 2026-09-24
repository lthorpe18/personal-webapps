# Trip Planner — Current State (24 Sep 2026)

## Source of truth
Repository: lthorpe18/personal-webapps
App folder: japan-trip/
Do not change or reuse the existing trip-planner/ app unless explicitly requested.
This app is a reusable, multi-trip PWA, with Japan December 2026 as its first real trip.

## Verified implementation
- Static HTML/CSS/JavaScript PWA committed on main; home-screen manifest, icon and service worker.
- Home, tasks, itinerary (stays and activities), bookings, decisions, settings and trip switching.
- Authenticated Supabase frontend, trip members and email invitations, import/export and CRUD implemented in source.
- Separate SQL schema written under supabase/001_initial_schema.sql, including trip-scoped RLS.
- JS syntax and offline-worker syntax checks passed; manifest JSON parsed; basic rendered-screen smoke checks passed.
- GitHub Pages was enabled and a successful deployment of an earlier app commit was recorded. The latest code may have a newer in-progress deployment; check GitHub Actions before claiming deployment of a particular SHA.

## Not yet verified or activated
- No new dedicated Supabase project created: requires user's selection of organisation, cost quote and explicit confirmation.
- SQL migration has not run against a database; its actual behaviour and RLS isolation require backend testing.
- Public config.js has blank URL/publishableKey, so the app shows a fictional preview and does not persist changes.
- No cross-device sign-in, email invitation or owner/editor/viewer live acceptance tests.
- Published subpath and full iPhone home-screen behaviour have not been independently tested in a device browser.

## Private Japan data
The 2026 trip's detailed tasks, stay dates and sensitive bookings are in a PRIVATE JSON import file supplied to the user in the ChatGPT conversation, not in this repository.
Do not commit the import JSON or personal confirmation emails. Import after the new private backend is connected.
Confirmed travel priorities: Universal Studios Japan and Nagashima Spa Land are the two theme parks; Fuji-Q was dropped. A separate Mount Fuji sightseeing opportunity remains desired.

## Next action
Ask the user to choose the Supabase organisation for a dedicated project (the account currently exposes ORB). Obtain a project cost quote and approval using Supabase's required confirmation workflow; only then create it, run/test the schema and configure email authentication and public config.js. Then import the private Japan JSON and perform owner/editor/viewer and iPhone acceptance tests.

Do not represent the current preview as secure synced storage before the backend is provisioned and tested.
