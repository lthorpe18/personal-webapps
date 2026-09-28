# Trip Planner

A mobile-first PWA for multiple holidays, developed in the japan-trip folder of personal-webapps. The existing trip-planner app is left unchanged.

The app includes Home, Tasks, Itinerary, Bookings and More (Decisions and Settings). It supports trip-specific access roles, member invitations, import/export, and iPhone Add to Home Screen.

## Active ORB project (24 September 2026)

The Trip Planner Supabase project has already been created in ORB (London, `eu-west-2`), and the schema plus indexes are installed. `config.js` now contains its public project URL and publishable key. **Do not create another project** for this deployment.

Before sign-in works correctly, set the Supabase Authentication Site URL and allowed Redirect URL to `https://lthorpe18.github.io/personal-webapps/japan-trip/` (including the trailing slash). This setting is not exposed by the connected Supabase tools. See `CURRENT_STATE.md` for verified progress and remaining checks.

## Current deployment

GitHub Pages: https://lthorpe18.github.io/personal-webapps/japan-trip/

The dedicated Trip Planner Supabase database and browser configuration are installed. The user has signed in on their iPhone and shown a populated Japan trip. Email links remain available; the app also supports setting a password from More > Settings > Account & connection and using it on devices without personal email access.

Do not create another Supabase project or commit private itinerary JSON. The `supabase/` directory is the deployment record for the existing dedicated project, not an instruction to rerun the initial migration.

## Shareable itinerary PNG

From **Itinerary**, tap **Share table** to preview a clean three-column image (Date, Base / Route, Activities) built directly from the active trip. Choose Simple or Detailed, then share through the native file share sheet on supported iPhones or download the PNG on desktop.

The export groups consecutive flexible days at the same base; specific dated activities retain their own day; undated activities appear separately as FLEXIBLE. Enter explicit arrow routes in the location field of a transport activity to display them in the base/route column. Cancelled stays and dropped activities are excluded.

Only trip title, dates, stay locations and activity titles/places are included by default. No booking records, tasks, prices or accommodation notes are read. Activity notes can be included explicitly after checking a clear privacy warning and inspecting the preview; these may contain private links and references. Export is client-side using Canvas, with no new backend API or database write.

## Privacy, syncing and portability

The static GitHub Pages frontend is publicly accessible. Private itinerary and booking details live only in the authenticated Supabase database. The service worker caches public app files, never Supabase responses or private travel records. Private data requires an internet connection.

Edits sync through Supabase, with refresh, foreground refresh and optional realtime change subscriptions. Export downloads a JSON copy of a trip, including private booking references; keep it secure. Import creates a new trip and never replaces an existing trip.

The app is destination-independent: each holiday has its own tasks, overnight bases, activities, bookings, decisions and members. The Japan import should reflect the current decision that Fuji-Q is dropped, and USJ and Nagashima are the two theme parks.
