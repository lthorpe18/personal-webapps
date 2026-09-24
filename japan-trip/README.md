# Trip Planner

A mobile-first PWA for multiple holidays, developed in the japan-trip folder of personal-webapps. The existing trip-planner app is left unchanged.

The app includes Home, Tasks, Itinerary, Bookings and More (Decisions and Settings). It supports trip-specific access roles, member invitations, import/export, and iPhone Add to Home Screen.

## Active ORB project (24 September 2026)

The Trip Planner Supabase project has already been created in ORB (London, `eu-west-2`), and the schema plus indexes are installed. `config.js` now contains its public project URL and publishable key. **Do not create another project** for this deployment.

Before sign-in works correctly, set the Supabase Authentication Site URL and allowed Redirect URL to `https://lthorpe18.github.io/personal-webapps/japan-trip/` (including the trailing slash). This setting is not exposed by the connected Supabase tools. See `CURRENT_STATE.md` for verified progress and remaining checks.

## Current state

The frontend is committed. Without a configured Supabase project, it displays a fictional preview; preview changes are not saved. No personal booking information is stored in this public repository.

## GitHub Pages

In the repository Settings > Pages, select Deploy from a branch, main, /(root) if Pages is not already configured. This keeps the existing static apps accessible. The anticipated app path is https://lthorpe18.github.io/personal-webapps/japan-trip/ but verify the actual live address in GitHub Pages settings.

## Connect private data

Create a NEW dedicated Supabase project with the user's approval of organisation and any project cost. Do not reuse another application's database.

Apply supabase/001_initial_schema.sql to the new database. Every public table has row-level security. Trip members can only read their permitted trips, and viewers have read-only access.

Set Authentication > URL Configuration to the actual Pages URL, and enable Email authentication. For iPhone home-screen sign-in, configure the Email Magic Link template to include the OTP token if you want six-digit email codes; ordinary magic links are supported too.

Update config.js with the new project's URL and PUBLIC publishable key. Never place a secret or service-role key in frontend files. Sign in and import the private trip JSON using More > Settings > Import trip JSON.

Invite family members using More > Settings. The invitation is claimed when they log in with the matching verified email. The app does not automatically send an invitation email; share the app URL yourself.

## Privacy, syncing and portability

The static GitHub Pages frontend is publicly accessible. Private itinerary and booking details live only in the authenticated Supabase database. The service worker caches public app files, never Supabase responses or private travel records. Private data requires an internet connection.

Edits sync through Supabase, with refresh, foreground refresh and optional realtime change subscriptions. Export downloads a JSON copy of a trip, including private booking references; keep it secure. Import creates a new trip and never replaces an existing trip.

The app is destination-independent: each holiday has its own tasks, overnight bases, activities, bookings, decisions and members. The Japan import should reflect the current decision that Fuji-Q is dropped, and USJ and Nagashima are the two theme parks.
