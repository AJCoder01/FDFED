# Provider functionality audit — 12 October 2026

Provider fixes are implemented within the assigned ownership boundary. The supported booking, listing, earnings, and daily scheduling flows work against the existing repository. A fully configurable weekly calendar, profile submission, customer-approved rescheduling, review replies, and notification read updates still require shared operations that do not exist. Those controls now explain their limitations instead of reporting fake success.

No Customer, Admin, Arbitrator, public/authentication, repository, context, routing, shared primitive, package, or mock-data files were changed. Existing browser storage was not reset. Tests used in-memory storage or fresh, disposable Chromium contexts.

## A. Provider functionality audit

| Page | Features checked | Bugs fixed | Remaining issues | Status |
| --- | --- | --- | --- | --- |
| ProviderDashboard | Counts, verification, earnings, recent/upcoming jobs, quick actions | Gross earnings replaced with completed paid net earnings; pending requests distinguished from accepted work; fabricated rating removed; verification comes from current profile; recent records sorted across both timestamp formats; upcoming records sorted by date/time | Profile status can only reflect the immutable shared demo profile until shared profile persistence exists | Supported flow verified |
| ProviderOnboardingPage | Business, coverage, skills, contact details, verification | Fake submission and fabricated document removed; saved profile shown accurately; unavailable updates disabled | No shared profile save/submission operation; Admin profile moderation is disconnected | Blocked dependency |
| ListingManagerPage | Create route, create/edit forms, category, price, duration, scope, policy, image URL, slots, preview, publication states | Create route opens the form; real edit/pause/archive/publish operations added; trimmed validation and real form submission; existing slots/status/rating preserved on edits; loading/errors/empty states; duplicate submission prevention | Marketplace ignores paused/archived visibility; Admin moderation does not persist; new drafts and approval queues are not supported by creation operation | Partial integration |
| AvailabilitySchedulerPage | Weekly profile display; service slot editing; daily date selection/navigation; stored bookings; customer availability | Replaced false schedule-save success with actual service-slot persistence; current date replaces hardcoded date; duplicate/overlapping/overnight slot validation; daily booking preview; reload persistence; drafts survive focus refresh | Weekly settings have no save operation and are not enforced; provider-wide overlaps, lead time, buffers, and timezone contract missing | Partial integration |
| JobInboxPage | Provider ownership, filters, acceptance/rejection, status changes, workspace navigation | Terminal/disputed jobs no longer expose request actions; repeat acceptance prevented; mandatory rejection reason; confirmation and pending states; immediate updates; cross-tab booking refresh | Customer-approved time proposal operation and response UI are missing; acceptance is a timeline event because shared status remains `active` | Supported actions verified; proposal blocked |
| JobDetailPage | Direct access, acceptance, start, completion, notes, timeline, schedule, payment, disputes | Other-provider bookings blocked; fresh status/ownership checked before mutations; work requires acceptance; whitespace-only completion rejected; repeat/stale transitions prevented through Provider entry points; reliable back route; actual hearing/ruling displayed | Shared status operation is still unrestricted and cannot atomically guard concurrent changes; dispute resolution does not update booking/payment records | Supported fulfillment verified |
| EarningsPage | Paid records, completed/pending/held totals, gross, fee, net, payment history | Paid active/disputed jobs no longer count as completed earnings; numeric arithmetic and stored fee/payout values; fabricated wallet-release labels removed; loading/error/empty states | Shared cash/refund/payment records and Admin payout-release claims remain inaccurate | Stored-record calculations verified |
| ReviewsPage | Stored customer reviews, provider ownership, rating, average, dates, empty state | Page-specific invented reviews removed; reads actual booking reviews; average explicitly describes stored reviews; false public-reply success removed | Customer submission does not persist; no public-reply write/read contract; public service aggregates are separate fixture values | Partial integration |
| ProviderLayout | Navigation, nested active state, profile label, notifications, mobile layout | Fixed invalid `justify` style; nested routes highlight the right item; verification label uses actual profile; notification button labelled and refreshes; Provider layout works at 390 px | Live shared profile/session and notification synchronization require context changes | Verified |
| NotificationDrawer | Filtering, saved read states, refresh, links, Escape, focus, dismissal | Current-user filtering, keyboard-operable links, dialog name/focus trap, focus restoration, scroll cleanup, error handling; payment wording clarified | Repository has no mark-read operation; upstream hearing/ruling notifications are not created | Supported drawer behavior verified |

## B. Calendar and scheduling verification

The intended weekly layout was preserved. No calendar library was added. Weekly day chips, working hours, and blackout dates display the actual provider profile and are explicitly read-only because there is no supported save operation.

The functional connection is `service.availableSlots` → `saveService` → `getAvailableSlots` → customer slot picker/checkout. The Provider preview uses the same availability operation as the customer. It does not maintain a separate booking or availability store.

Verified in actual browser workflows:

- Today's local date; selecting and clearing a date; Previous Day, Next Day, and Today.
- Year boundary: 1 January → 31 December → 1 January.
- Leap-year boundary: 28 February 2028 → 29 February → 1 March.
- Correct weekday/month/year formatting in Asia/Kolkata, America/Los_Angeles, and Pacific/Kiritimati.
- Slot addition/removal; duplicate prevention; full duration between slots; empty/invalid/overnight range rejection; midnight/noon conversion in repository/logic tests.
- Saved slots survive reload and reach the customer picker. Unsaved slot edits survive a focus-triggered data refresh.
- Existing bookings retain their original schedule when future service slots change and remain visible on their dates.
- An identical service/date/slot disappears after booking; a duplicate booking is rejected by the repository; cancellation releases that exact slot.
- Provider bookings update in an already-open tab after customer checkout. A stale Provider modal cannot revive a customer-cancelled job.

**Limits:** Weekly workdays, hours, blackouts, lead times, buffers, past dates, and overlaps between different services for the same provider are not enforced by the shared repository. Same-service slot configuration is validated, but provider-wide booking conflict prevention is incomplete. Stored times contain no explicit timezone. Existing proposed/disputed statuses can be displayed; a complete proposal/consent/reschedule workflow cannot be tested because it is absent. The native date picker's internal monthly navigation was not separately automated.

## C. Cross-role integration

| Workflow | Result | Issues | Files responsible |
| --- | --- | --- | --- |
| Customer checkout → Provider request → accept → start → complete → Customer/Admin views → earnings | Passed for supported lifecycle; identical IDs, schedules, timelines, amounts, commission, and payouts observed | Shared `active` status covers both request and accepted work; other entry points lack transition guards | `src/data/mockRepository.js`; Provider guards implemented in `providerUtils.js` |
| Request → Provider decline → Customer cancelled status → slot release | Passed, including rejection reason and stale-action protection | Payment remains `Paid`; no refund is recorded | `src/data/mockRepository.js`; `src/features/customer/BookingDetailPage.jsx` |
| Provider create/edit/state changes → Admin listing view → customer discovery | Creation, editing, persistence, Admin visibility, and published discovery passed | Admin moderation is local state; paused/archived listings remain discoverable/bookable | `src/features/admin/ListingModerationPage.jsx`; `src/data/mockRepository.js`; public service pages |
| Provider availability → customer slots → booking → Provider schedule | Passed for saved daily service slots and exact-slot blocking | Weekly scheduling and cross-service overlaps fail shared enforcement | `src/data/mockRepository.js`; shared provider profile/context |
| Customer review → Provider review view → reply | Existing stored reviews pass; new submission/reply integration blocked | Customer review only updates component state; reply persistence absent | `src/features/customer/BookingDetailPage.jsx`; `src/data/mockRepository.js` |
| Completed payments → Provider earnings → Admin ledger | Per-booking amounts and 5% commissions agree with stored records | Paid pending/held/cancelled amounts are not released earnings; shared refunds/cash states are inaccurate | `src/data/mockRepository.js`; `src/features/admin/AdminRevenuePage.jsx` |
| Customer dispute → Admin assignment → Arbitrator hearing/ruling → Provider details | Shared dispute, assignment, hearing, and ruling persistence passed; Provider reads the saved hearing/ruling | Customer hardcodes case service/provider/amount; ruling does not resolve booking/payment or dispatch notifications | Customer dispute page; shared repository; Arbitrator hearing/ruling pages |
| Changes while another role's page stays open | Provider cross-tab refresh passed | Other role pages generally fetch on mount only; shared notifications lack live synchronization | Customer/Admin/Arbitrator readers; `src/app/context/AppContext.jsx` |

## D. Code quality improvements and exact modified files

- `src/features/provider/ProviderDashboard.jsx`: data-derived metrics, correctly sorted recent/upcoming lists, real quick actions; removed unused service fetching and hardcoded statistics.
- `src/features/provider/ProviderOnboardingPage.jsx`: removed fake editable state/submission and displays the existing shared profile.
- `src/features/provider/ListingManagerPage.jsx`: one create/edit form, actual repository mutations, controlled fields and validation; no slot reset or status/rating overwrite on ordinary edits.
- `src/features/provider/AvailabilitySchedulerPage.jsx`: supported slot management and daily booking preview; removed disconnected weekly-save handler.
- `src/features/provider/JobInboxPage.jsx`: concise filtering and status-aware actions, authoritative updates.
- `src/features/provider/JobDetailPage.jsx`: ownership/status checks, straightforward fulfillment form, actual dispute details.
- `src/features/provider/EarningsPage.jsx`: clear completed/pending/held totals; removed false wallet credit claims.
- `src/features/provider/ReviewsPage.jsx`: actual booking reviews; removed duplicate local dataset and fake reply state.
- `src/features/provider/JobRequestActions.jsx`: shared inbox/detail confirmations and rejection validation.
- `src/features/provider/SlotEditor.jsx`: shared listing/scheduler slot controls.
- `src/features/provider/providerUtils.js`: shared financial/date/slot presentation and Provider transition checks; no separate persistence or booking engine.
- `src/features/provider/useProviderQuery.js`: one small reader hook for loading/errors, stale-request cleanup, retry, focus and cross-tab refresh. No new state-management architecture.
- `src/app/layouts/ProviderLayout.jsx`: navigation, verification, notification accessibility, and scoped responsive classes.
- `src/features/notifications/NotificationDrawer.jsx`: accessible navigation, focus management, refresh/errors, cleanup, and truthful read-state display.
- `src/index.css`: additions scoped under `.provider-workspace`; existing global styles retained.
- `src/features/provider/provider.test.mjs`: repeatable Node/Vite regression tests using disposable in-memory storage.
- `src/features/provider/PROVIDER_AUDIT.md`: this report.

Unused imports, duplicate defaults, redundant data fetching, obvious comments, invented values, and fake handlers were removed. No dependencies were added. `src/App.css` and `src/design-system/tokens.css` did not need changes.

## E. Problems outside Provider ownership

| Dependency | Exact cause / evidence | Recommended fix |
| --- | --- | --- |
| Provider profile and weekly persistence | Repository exports no provider/profile/availability save operation. `AppContext.jsx` loads profiles from `DEMO_USERS`. `ProviderModerationPage.jsx:13` owns a separate local list and `:53` updates only that list. Provider/Admin names and verification states can disagree. | Add shared provider read/save/moderation operations; connect context and Admin to that source; persist weekly schedule on the canonical provider record. |
| Weekly rules and provider-wide conflicts | `mockRepository.js:100` and `:166` inspect only service slot labels, exact dates, and same-service bookings. Isolated runtime probes returned Sunday, blackout, and past-date slots and allowed overlapping 09:00 AC / 09:30 electrical jobs for the same provider. | Apply the same provider schedule and duration-overlap validation in availability reads and booking creation. Define a scheduling timezone and reject past/out-of-hours/blackout bookings at the shared operation. |
| Time proposals/customer consent | `updateBookingStatus` only changes status/timeline; no proposal date/slot object, customer acceptance/decline operation, or customer response UI exists. | Persist the proposal separately from the confirmed schedule; add customer consent actions and shared conflict validation before updating the actual schedule. |
| Listing visibility/moderation | `ListingModerationPage.jsx:20` only calls `setServices`. `getServices`, `getServiceById`, and `createBooking` do not enforce publication status. A paused listing remained searchable and accepted checkout in an isolated repository probe. | Persist Admin decisions through repository operations; restrict public reads and new booking creation to permitted published listings while keeping provider/admin access to all states. |
| Draft creation and unrated listings | `saveService` at `mockRepository.js:130` unconditionally sets new records to `published`, rating `5.0`, review count `0`, regardless of a requested draft status. | Honor supported creation states; represent no reviews as unrated and render that accurately in public views. Do not claim an approval queue before its shared state exists. |
| Customer review and provider reply persistence | `BookingDetailPage.jsx:43` writes review fields only with `setBooking`; browser submission confirmed storage stayed unchanged. No review/reply operation exists. Public rating/count values come from services and do not derive from stored booking reviews. | Persist customer reviews and provider replies through a canonical review operation, enforce booking ownership/completion, and update shared rating/count displays from that source. |
| Cash/refunds/earnings | `createBooking` at `mockRepository.js:195` always records `Paid`, including Cash After Service. Cancellation changes only status; `getRevenueStats` still includes cancelled paid records. `resolveTicket` at `:317` stores a refund outcome string without changing payments. Admin labels estimated net totals as released payouts. | Persist actual mock payment/refund states and commission reversals; distinguish expected net amounts from completed earnings and recorded payouts in Admin. |
| Shared transition enforcement | `mockRepository.js:277` accepts any status and appends every repeated transition. Runtime probes allowed cancelled → completed and duplicate completed updates. Provider guards read before writing but cannot make this shared operation atomic. | Validate allowed transitions and expected current state inside the shared mutation; use canonical acceptance metadata/status instead of requiring all roles to infer acceptance from text. |
| Incorrect dispute/ticket booking metadata | `DisputeFilingPage.jsx:27` hardcodes washing-machine service, provider, and ₹649 even when filing for another booking. `SupportTicketPage.jsx:33` also uses generic service/provider labels. | Load the selected booking, validate its ownership, and derive service, provider, and amounts from that record. |
| Dispute links, final outcomes, and notifications | `createDispute` marks the booking disputed but omits `disputeId`/flags. `scheduleHearing` at `mockRepository.js:380` and `issueRuling` at `:396` only persist the dispute. Browser/probe tests confirmed a ruled case leaves the booking disputed and does not change payment or notify parties, although Arbitrator pages claim it does. | Persist the booking/case relationship, apply the agreed booking/payment outcome, and create actual party notifications before reporting completion/dispatch. |
| Notification read/live state | Only `getNotifications` exists. `AppContext.jsx:65` loads on user change or explicit reload, without mutation subscriptions or stale-response protection. | Add shared mark-read operations and refresh notifications on meaningful data changes; ignore responses for old users. |
| Other-role live state | Customer/Admin/Arbitrator readers generally load once in `useEffect`; public slots reload on service/date changes only. Source reviewed; automatic refresh of these already-open views was not fixed or comprehensively browser-tested. | Add a shared data-change subscription or focus/storage refresh with cleanup and stale-request protection to the responsible readers. |
| Shared form/modal accessibility | `TextField` and `Select` display `required` but do not forward it to native controls; `Modal` has no accessible title association or focus trap. Provider manually validates submissions and the owned notification drawer has proper focus handling. | Fix native required/label forwarding and dialog naming/focus behavior in the shared primitives. |

## F. Final verification

| Check | Executed result |
| --- | --- |
| Original baseline `npm run build` | Passed before implementation |
| Final `npm run build` | Passed; Vite 8.2.1 production bundle |
| `node --test src/features/provider/provider.test.mjs` | 18 tests passed, 0 failed |
| Development-browser route smoke | All eight Provider pages plus create-listing route loaded without runtime errors |
| Production Chromium workflows | 33 checks passed, including actual customer checkout, Provider lifecycle, listing management, Customer/Admin views, dispute assignment/hearing/ruling reads, mobile layout, dark theme, and absence of runtime errors/React warnings |
| Additional production browser edge checks | 8 checks passed: empty states, read failure/retry, save failure, invalid image URL and Enter submission, two additional timezones, live provider tab update, stale-modal rejection |
| Final recent-bookings browser check | Passed on the final production dashboard; correct chronological seed order |
| Shared repository limitation probes | 12 documented limitations reproduced in isolated in-memory storage |
| `git diff --check` and ownership inspection | Passed; changes confined to assigned files |

Browser harnesses used the already-bundled Playwright runtime, without package changes. Scripts from this session are `/private/tmp/fdfed-provider-e2e.mjs`, `/private/tmp/fdfed-provider-edge-tests.mjs`, `/private/tmp/fdfed-provider-recent-test.mjs`, and `/private/tmp/fdfed-repository-probes.mjs`; the repeatable repository/logic suite is kept in the Provider folder.

External Unsplash images were replaced with harmless image responses in automated browser tests; image hosting availability was not tested. Chromium was tested at desktop and 390 px mobile sizes; Safari/Firefox and every intermediate screen size were not tested. Native file uploads, document verification, financial transfers/refunds, weekly availability persistence, review replies, notification read mutations, and customer-approved rescheduling cannot be verified end to end because their shared implementation is missing. No claim is made that those workflows are complete.
