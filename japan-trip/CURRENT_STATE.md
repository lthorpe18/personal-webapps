# Trip Planner — Current State (24 Sep 2026)

## Source of truth
Repository: lthorpe18/personal-webapps
App folder: japan-trip/
Live Pages base: https://lthorpe18.github.io/personal-webapps/
App path: https://lthorpe18.github.io/personal-webapps/japan-trip/
Do not change or reuse the existing trip-planner/ app unless explicitly requested.
This application is destination-independent and supports multiple trips.

## Verified and completed
- A dedicated Supabase project named Trip Planner was created in the ORB organisation, London region (eu-west-2); project ref: zrjjjbavwflbrdsbgeli. Cost quote: 0 per month, approved through Supabase.
- Initial schema and a foreign-key index migration were applied successfully to that dedicated project.
- Database checks found 8/8 app tables with row-level security, no anon SELECT privileges on those tables, six realtime-enabled content tables, seven security triggers, and invitation claim RPC restricted to authenticated callers.
- Supabase security advisor reports ONE intentional warning for public.claim_trip_invitations(): a deliberately authenticated-only SECURITY DEFINER RPC. It derives identity from the verified email and auth.uid(), takes no user-controlled arguments, and does not grant anon EXECUTE. Reassess if altering the invitation model.
- The public GitHub config.js is set to this project's URL and its publishable key only. Never commit service-role or secret keys.
- Home, Tasks, Itinerary, Bookings, Decisions, Settings, import/export and trip switching exist in source. Prior local JavaScript syntax/render/import smoke tests passed.
- GitHub Pages is enabled for the repository. Confirm the deployment of the CURRENT main SHA in Actions before describing a version as live.

## Remaining acceptance checks (as of 28 Sep 2026)
- The user has shown the populated Japan 2026 trip in the running iPhone app. Earlier statements that the import had not happened are stale; do not re-import without explicit authorisation.
- Confirm login and syncing on the work laptop and a second signed-in family account. Invitations, viewer/editor permissions and realtime updates have not had end-to-end tests with distinct real users.
- Confirm the share image's visual appearance and native iPhone share sheet using a real device. Mocked image-generation tests are not the same as an iPhone visual test.
- Keep private trip JSON and booking references out of the public GitHub repo.

## Japan scope
Current plan: Universal Studios Japan and Nagashima Spa Land are the two theme parks. Fuji-Q was dropped. A separate Mt Fuji sightseeing opportunity remains desirable. Accommodation and attractions beyond flights and Heathrow hotel should not be marked booked until confirmed.

## Next action
Check that the current main SHA is deployed to GitHub Pages. User acceptance: open Itinerary, tap Share table, inspect the PNG preview, then test native share on iPhone / download on work laptop. Do not change the existing separate trip-planner app.

## Password sign-in for devices without email access (24 Sep 2026)
- Added Sign in with a password on the login screen and Set or change password in More > Settings > Account & connection.
- Existing email-link sign-in is retained. Users can open a magic link on their phone once, then set their own password in the signed-in app. They can thereafter sign in on their work laptop without accessing personal email there.
- Account settings can be reached even when no trip has yet been imported. Password form requires at least 12 characters and matching confirmation; app never commits or logs credentials.
- Local syntax, rendered-state, mocked sign-in, password-update and mismatched-confirmation tests passed. Real device sign-in and backend password update have not yet been independently verified.
- HTML scripts and CSS use version 20260924-5; service worker shell cache v5. GitHub Pages deployment must be checked for the latest SHA.
- No Supabase Email Template change is required for this password route.

## Mobile overview repair (24 September 2026)
- User-supplied iPhone screenshot showed the Overview title overlapping the system status bar, excessive hero/three-card dashboard height, and expanded multi-paragraph task notes obscuring the checklist.
- Updated the shared mobile top inset with an installed-PWA minimum; compressed the home hero/date and merged its three metrics into one compact strip; removed redundant home-page explanatory copy; increased checklist control sizes.
- All task notes now live behind an accessible native Details disclosure on both the Overview and Tasks tabs. Text is still available and editable, including long URLs. No task or booking records were modified.
- Asset query version 20260924-6 and offline shell cache v6 force the updated CSS/JS on refresh.
- Static syntax and mocked HTML rendering checks passed for overview, task list, notes disclosure, safe-area CSS, and asset version. Visual acceptance on the user's physical iPhone remains outstanding.
- The screenshot shows a populated Japan 2026 trip in the app. Previous notes saying no trip was imported may now be outdated; verify account/device sync before claiming backend persistence.

## Itinerary image export (28 Sep 2026)
- Added `itinerary-export.js` with pure row derivation from current trip dates, `trip_stops` and `activities`, and a client-side Canvas PNG renderer. No Supabase migration, storage, booking query or external image-generation service.
- The Itinerary tab has a Share table button and separate preview dialog with Simple / Detailed options. Notes are excluded by default and require explicit opt-in with a private-information warning. Share-ready PNG uses native Web Share API file sharing where supported; fallback downloads the same PNG.
- Specific activity dates become separate rows; unplanned adjacent days at the same overnight base are grouped; undated activities are marked FLEXIBLE at the end. Explicit transport routes with an arrow can override the base/route label. Cancelled stays and dropped activities do not export. Nothing is manually hardcoded for Japan, so the feature works for future trips.
- Final asset version: `20260928-8`; service worker `trip-planner-shell-v8`, versioned export module `?v=2`. Preserve prior export format `trip-planner/v1`.
- Verify GitHub Pages deployment and acceptance tests before claiming the feature is live and fully working.


## Day-by-day / Travel Mode (4 Oct 2026)
- Added a first-class **Days** navigation destination intended as the simple while-travelling view.
- Days derives its content from existing trip data rather than duplicating itinerary text: activities, bookings, overnight stops, transport legs and trip assets.
- Added a horizontal date strip, selected-day heading, contextual First up / Next summary, rich activity cards, structured transport-leg cards and a persistent Tonight accommodation card.
- Booked activities can expose confirmation links and stored tickets directly from the day timeline.
- Added a private ticket-wallet dialog. The Snow Monkey booking on 21 Dec is linked to five stored ticket assets and can open them as a swipe/click-through QR wallet.
- Added structured schema support before the UI: activity times/order/address/map/booking link; booking stop/check-in/check-out/address/map fields; transport_legs with endpoint timezones, services, reservations and seat metadata; assets can link to activities, bookings, stops or transport legs.
- Backfilled confirmed Tokyo Airbnb, Shibu Hotel and Haneda accommodation metadata; Snow Monkey admission is a first-class booking linked to its activity/assets; confirmed SAS flight sectors are stored as transport legs.
- V1 intentionally does not cache private Supabase data offline. QR payloads can be rendered in the ticket wallet while online; an explicit secure offline-trip feature remains later work.
- Static JavaScript syntax and source-presence checks passed on the feature branch. Real signed-in mobile visual/interaction acceptance remains required after GitHub Pages deployment.
