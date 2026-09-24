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

## Outstanding to make the app usable by the family
1. Supabase Dashboard > Authentication > URL Configuration: set Site URL and Redirect URL to the exact app URL above, including trailing slash. Connected Supabase tools do not expose Auth URL configuration writes.
2. For reliably signing in to the installed iPhone PWA, optionally edit Supabase's Email Magic Link template to include the OTP token. The app supports both magic links and code entry, but the default template may send only a link.
3. User must sign in with their verified email; do not create or impersonate a login via backend SQL.
4. Import the private Japan 2026 JSON into the signed-in account. Its personal details and booking references must NOT be committed to this public repository. The user received the file in their earlier ChatGPT chat.
5. Verify owner/editor/viewer authorization, real email invitation claims, cloud persistence, realtime, and the actual iPhone Add to Home Screen flow. Tests against real signed-in accounts have not yet run.

## Japan scope
Current plan: Universal Studios Japan and Nagashima Spa Land are the two theme parks. Fuji-Q was dropped. A separate Mt Fuji sightseeing opportunity remains desirable. Accommodation and attractions beyond flights and Heathrow hotel should not be marked booked until confirmed.

## Next action
Complete the manual Supabase Auth URL configuration in the dashboard, then sign in via the Pages app and import the private JSON. Run owner/editor/viewer and iPhone acceptance checks. Preserve privacy and the existing trip-planner app.

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
