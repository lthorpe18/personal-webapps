# Trip Planner

A mobile-first PWA for multiple holidays, developed in the japan-trip folder of personal-webapps. The existing trip-planner app is left unchanged.

The app includes Plan, Tasks, Wallet and More (Decisions and Settings). It supports trip-specific access roles, member invitations, import/export, and iPhone Add to Home Screen.

## Active ORB project (24 September 2026)

The Trip Planner Supabase project has already been created in ORB (London, `eu-west-2`), and the schema plus indexes are installed. `config.js` now contains its public project URL and publishable key. **Do not create another project** for this deployment.

Before sign-in works correctly, set the Supabase Authentication Site URL and allowed Redirect URL to `https://lthorpe18.github.io/personal-webapps/japan-trip/` (including the trailing slash). This setting is not exposed by the connected Supabase tools. See `CURRENT_STATE.md` for verified progress and remaining checks.

## Current deployment

GitHub Pages: https://lthorpe18.github.io/personal-webapps/japan-trip/

The dedicated Trip Planner Supabase database and browser configuration are installed. The user has signed in on their iPhone and shown a populated Japan trip. Email links remain available; the app also supports setting a password from More > Settings > Account & connection and using it on devices without personal email access.

Do not create another Supabase project or commit private itinerary JSON. The `supabase/` directory is the deployment record for the existing dedicated project, not an instruction to rerun the initial migration.

## Shareable itinerary PNG

From **Plan**, tap **Share table** to preview a clean three-column image (Date, Base / Route, Activities) built directly from the active trip. Choose Simple or Detailed, then share through the native file share sheet on supported iPhones or download the PNG on desktop.

The export groups consecutive flexible days at the same base; specific dated activities retain their own day; undated activities appear separately as FLEXIBLE. Enter explicit arrow routes in the location field of a transport activity to display them in the base/route column. Cancelled stays and dropped activities are excluded.

Only trip title, dates, stay locations and activity titles/places are included by default. No booking records, tasks, prices or accommodation notes are read. Activity notes can be included explicitly after checking a clear privacy warning and inspecting the preview; these may contain private links and references. Export is client-side using Canvas, with no new backend API or database write.

## Privacy, syncing and portability

The static GitHub Pages frontend is publicly accessible. Private itinerary and booking details live only in the authenticated Supabase database. The service worker caches public app files, never Supabase responses or private travel records. Private data requires an internet connection.

Edits sync through Supabase, with refresh, foreground refresh and optional realtime change subscriptions. Shared export downloads the records visible to all trip members, excluding Private records and their linked descendants. Shared booking references remain included; keep the file secure. Import creates a new trip and never replaces an existing trip.

The app is destination-independent: each holiday has its own tasks, overnight bases, activities, bookings, decisions and members. The Japan import should reflect the current decision that Fuji-Q is dropped, and USJ and Nagashima are the two theme parks.

## Record privacy (8 November 2026)

See [PRIVACY.md](PRIVACY.md) for Shared/Private records, member access, owner preview, safe exports, verification and recovery. Use More → Settings → Privacy & access. Public sharing now enforces record and linked-parent visibility.

## Unified Plan and Wallet (8 November 2026)

Plan replaces Home, Days and Itinerary. It shows compact days grouped by overnight base, with a trip summary and tasks shortcut. Tap a day for its timeline, then tap a card for a shared detail sheet. Blue marks stays, purple travel, amber activities and coral meals; icons and text labels identify every type without relying on colour. Arrival/check-out events and quiet-day accommodation are derived from the existing records, including accommodation just outside the main trip dates. Flexible activities appear at the end.

Wallet replaces the long booking-card screen with search and category filters. A ticket-name search finds its associated reservation. Both Plan and Wallet use `trip-view.js` and the same detail sheet, which contains references, costs, addresses/maps, connections, tickets, notes and permitted edit actions. Linked stops/reservations and activities/journey legs are combined for display only. Older records without links use conservative named/date matching; ambiguous matches stay separate. No source record is deleted or rewritten by the presentation layer. Cancelled reservations remain accessible in Wallet.

The public read-only page uses the same renderer with the existing restricted database projection. It does not fetch authenticated rows, private attachments or additional booking details. Privacy preview, safe itinerary images/JSON exports, editing, invitations and trip switching are retained.

Checks: `node japan-trip/trip-view.test.mjs` and `node japan-trip/privacy.test.mjs`. The model tests cover deduplication, legacy/public data, shared detail identity, search, check-in/out, cancelled reservations, HTML escaping, source immutability and private-parent filtering. Browser QA covers a 390px mobile frame, day expansion, detail sheets, Wallet search and ticket access. Physical iPhone/PWA/native sharing remain device acceptance checks.

## Accommodation listing links

Accommodation detail sheets in Plan and Wallet include a separate Listing / website button. Public property links are stored in `listing_url` on the stay, or on a standalone booking. Edit the stay to change its URL; if a URL belongs to its linked booking instead, the editor directs you there. Listing links follow existing record/parent visibility and appear in the safe public projection only for Shared records. Private confirmation links and reservation data remain separate.

## Mobile form sizing

All inputs, selects, textareas and editable text use at least 16px type before focus to prevent iPhone focus zoom. Form columns can shrink within their grid tracks; date/select/text controls share a 48px height, and narrow phone editors stack below 360px. Pinch zoom is preserved.

## Costs and repayments
The **Costs** tab tracks vendor payments separately from repayments between people. Add a standalone cost, or expand **Booking amounts not yet tracked** and choose **Track cost**. Booking tracking copies the amount and currency at that moment; later changes to a booking do not overwrite its cost record. Payment status starts unknown. Use `0` for confirmed unpaid, a partial amount for a deposit, or **Mark vendor fully paid**. Due dates are optional.

Name the person paying the vendor and add other people with exact amounts, percentages, or an equal split including the payer. The unallocated remainder belongs to the payer; rounding pennies stay with the payer. Record **Repaid so far** for part repayments or use **Mark repaid**. Edit to correct any payment entry. People are labels, not accounts or invitations. Shared costs are readable by trip members; owners/editors record payments on their behalf. Nothing transfers money or sends reminders. Totals and balances remain separate by currency; no exchange-rate estimates, budgeting system or payment ledger is introduced.

Costs default to Shared, support the same owner-managed Private grants, and inherit linked booking/parent restrictions in RLS and server preview. All costs are excluded from unauthenticated public pages, itinerary images and general trip JSON exports. The totals only include visible, explicitly tracked costs. The remaining untracked booking amounts are listed separately. No existing real booking/payment data is pre-populated or assumed paid. Saved cost forms and settlement buttons use `updated_at` to reject stale updates. A booking with a cost cannot be deleted until its cost is removed, preserving financial records.

Validation: `node japan-trip/costs.test.mjs`, `node japan-trip/privacy.test.mjs`, `node japan-trip/trip-view.test.mjs`; run `supabase/test_costs.sql` administratively for an entirely rolled-back owner/editor/viewer/outsider/anonymous fixture. Browser QA covers mobile entry, percentage and equal split controls, independent vendor/repayment settlement and booking prefill. Physical iOS testing and cross-device realtime delivery are not verified.

Rollback: redeploy the preceding Git commit to hide the feature while retaining every cost. The additive `trip_expenses` table can remain safely with RLS. Before any full schema rollback, back up this table; the pre-change helper definitions are retained in `private.privacy_backups` under `before_trip_costs_function`. Restoring them disables new cost reads without changing existing itinerary data. Do not drop a populated cost table as a routine rollback.

### Compact costs view
The simplified screen shows two balances per currency and a single expandable list. Vendor and individual repayment chips show status without opening a record. Tap an item for **Vendor paid**, **[person] repaid**, and the link to edit partial amounts or dates; payment actions retain the expanded item. Additional totals, payer details, booking links and notes are folded away. Creation keeps the vendor due date visible, with payment details/notes/privacy under a disclosure. Existing values and privacy controls are preserved.

Vendor due dates appear directly on unpaid/unknown rows: **Due today**, **Overdue**, or a formatted future date. Upcoming dates within seven days are highlighted; fully paid vendors no longer show overdue warnings. Date comparisons use the trip’s local calendar day. Paid records retain the original due date in their detail. No new database fields, assumed dates, automatic reminders or repayment deadlines are introduced.
