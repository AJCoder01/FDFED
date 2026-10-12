# Provider audit and presentation guide

Updated 13 October 2026. The Provider section and its shared dependencies now use the same persisted profiles, schedules, bookings, reviews, disputes, and notifications. The expanded changes follow the later request to fix the previously reported teammate dependencies. The existing design and mock localStorage architecture are preserved.

Earlier work is saved on `codex/provider-audit-baseline` (`5da6b21`). The complete implementation is on `codex/provider-workflow-complete`, based on that baseline. `main`, `mockData.js`, package configuration, and the user's browser storage were not changed or reset by testing.

## A. Provider functionality audit

| Page | Features checked | Bugs fixed | Remaining issues | Status |
| --- | --- | --- | --- | --- |
| ProviderDashboard | Counts, recent/upcoming jobs, verification, earnings, navigation | Data-derived counts and completed paid net earnings; pending versus accepted requests; correct timestamp sorting; live updates | Mock data scope only | Verified |
| ProviderOnboardingPage | Profile editing, validation, persistence, verification submission and Admin feedback | Canonical saved profile replaces disconnected demo state; required business/area/skills; explicit document filename requirement; real review queue and feedback | Document filenames are demo records, without actual upload or identity verification | Verified |
| ListingManagerPage | Create/edit, drafts, publish/pause/archive, preview, category/price/duration/image/slots | Real persistence; edits preserve slots and status; approved-provider publication gate; hidden listings excluded from customer discovery and checkout; unrated new listings; save errors retain inputs | External image hosting was not tested | Verified |
| AvailabilitySchedulerPage | Weekly days/hours, blackouts, lead time, buffers, service slots, daily navigation and bookings | Actual schedule persistence and customer enforcement; cross-service conflicts; India timezone; year/leap-day navigation; drafts survive refreshes | Scheduling uses Asia/Kolkata; native date picker internals were not separately automated | Verified |
| JobInboxPage | Provider ownership, filters, accept/decline/propose, live incoming jobs | Valid status transitions; confirmations; decline reason/refund; proposals preserve the original reservation and require customer consent | Mock repository scope only | Verified |
| JobDetailPage | Ownership, acceptance/start/completion, completion notes, timelines, payments, disputes | Stale/repeated/invalid actions rejected in the repository; cash collection explicitly recorded at completion; correct dispute relationship, response, evidence records, hearing link, and ruling outcome | Hearing links are supplied by the user; video conferencing is external | Verified |
| EarningsPage | Completed, pending and held amounts, fees, gross payments, refunds and history | Actual paid records and stored net amounts; cash excluded before collection; refunds reverse commission; no fabricated wallet-release claims; Admin agreement | No actual payment transfer or wallet exists | Verified |
| ReviewsPage | Stored reviews, averages, replies/editing, empty state | Customer reviews and Provider replies persist; public ratings and replies derive from the same reviews | Mock persistence only | Verified |
| ProviderLayout | All assigned routes, active navigation, role switching, themes and mobile layout | Correct nested navigation; canonical profile retained; safe SuperUser entry; readable responsive layout | Chromium tested at desktop and 390 px widths | Verified |
| NotificationDrawer | User scope, single/all read, refresh, links, dismissal, keyboard and focus | Real persisted read state; relevant booking/dispute notifications; live updates; Escape works after a focused button becomes disabled; focus and scroll restored | In-app notifications only | Verified |

## B. Calendar and scheduling

The existing weekly scheduler and daily booking view are retained. No calendar library or separate Provider booking store was added.

The connection is `provider.weeklyAvailability` plus `service.availableSlots` → shared `availableSlots` → Customer picker and booking creation. The Provider preview calls that same operation. Creation and proposal acceptance recheck availability at the time of writing.

Verified:

- Working days, daily hours, full service duration, blackout dates, lead time and buffers save and survive reload.
- Past dates, invalid dates, closed weekdays, out-of-hours appointments and overnight slots are blocked.
- Duplicate and overlapping appointments are blocked across every service owned by one provider.
- Two actual Customer checkout tabs competing for the same slot create one booking. A browser lock serializes the final availability check and write.
- Cancelled bookings release their appointments. A time proposal keeps the original reservation; customer acceptance rechecks conflicts before moving it.
- Existing bookings keep their confirmed schedule after future availability changes.
- Previous Day, Next Day, Today, selection, year boundaries and leap days work. India dates stay correct even when the browser timezone is Los Angeles or Kiritimati.
- Unsaved weekly, profile and slot edits survive focus-triggered refreshes. An already-open Provider inbox updates after checkout in another tab.

## C. Cross-role integration

| Workflow | Result | Issues | Files responsible |
| --- | --- | --- | --- |
| Profile → Admin decision → Provider feedback/publication | Persisted business details and verification agree across roles | Demo document record only | `mockRepository.js`, `AppContext.jsx`, `ProviderOnboardingPage.jsx`, `ProviderModerationPage.jsx` |
| Listing → Admin visibility/moderation → Customer discovery | Draft/private preview and publish/pause/archive rules enforced; decisions persist | None in tested flow | `mockRepository.js`, `ListingManagerPage.jsx`, `ListingModerationPage.jsx`, public service pages |
| Availability → checkout → Provider schedule | Weekly rules and conflicts enforced by one shared rule function | India timezone contract | `scheduling.js`, `mockRepository.js`, `AvailabilitySchedulerPage.jsx`, `ServiceDetailPage.jsx` |
| Booking → accept/decline/propose → start/complete | Shared IDs, schedule, acceptance, timeline and payment states; customer consent persists | None in tested flow | Repository, Provider job pages, `BookingDetailPage.jsx`, `BookingWizard.jsx` |
| Completed job → review → Provider reply/public rating | Real review and public reply persistence; no fabricated rating for unreviewed listings | None in tested flow | Repository, `ReviewsPage.jsx`, Customer booking and public service detail pages |
| Payments/refunds → Provider earnings → Admin ledger | Completed net earnings, retained fees and refunds agree; cash remains pending until recorded | Mock ledger; no transfer | `bookingRules.js`, repository, `EarningsPage.jsx`, Admin booking/revenue pages |
| Support → refund or arbitration → Provider job | Correct booking metadata and payment change; escalation creates an actual linked case | Redo is a request requiring an agreed appointment | Repository, Customer support, Admin ticket resolution, Provider job detail |
| Dispute → response → assignment → hearing → ruling | Actual booking/case relationship, Provider statement, hearing link, notifications and refund; final ruling restores/resolves booking status | Filename records only; no actual uploads | Repository, Customer dispute, Admin assignment, Arbitrator case/hearing/ruling and Provider response/detail |
| Changes in another tab → current page | Shared readers and notifications refresh; stale async responses are discarded | Uses browser storage on the same origin | `repositoryEvents.js`, `useRepositoryQuery.js`, `AppContext.jsx`, affected role readers |

## D. Code quality and modified files

The pages hold only form inputs, filters, dialogs, busy/error state and the data they display. Repository mutations enforce rules once. Small components share the inbox/detail job actions, listing/schedule slot editor, and dispute response form. No state library or dependency was added.

| Responsibility | Exact files |
| --- | --- |
| Provider pages | `src/features/provider/ProviderDashboard.jsx`, `ProviderOnboardingPage.jsx`, `ListingManagerPage.jsx`, `AvailabilitySchedulerPage.jsx`, `JobInboxPage.jsx`, `JobDetailPage.jsx`, `EarningsPage.jsx`, `ReviewsPage.jsx` |
| Reused Provider controls | `src/features/provider/JobRequestActions.jsx`, `SlotEditor.jsx`, `ProviderDisputeResponse.jsx`, `providerUtils.js` |
| Shared persistence and rules | `src/data/mockRepository.js`, `bookingRules.js`, `scheduling.js`, `repositoryEvents.js`, `useRepositoryQuery.js`, `src/utils/date.js` |
| Shared state/layout | `src/app/context/AppContext.jsx`, `src/app/layouts/ProviderLayout.jsx`, `src/features/notifications/NotificationDrawer.jsx` |
| Forms/dialogs/status styles | `src/design-system/primitives/Button.jsx`, `ConfirmDialog.jsx`, `Modal.jsx`, `TextField.jsx`, `Select.jsx`, `StatusBadge.jsx`, `src/design-system/tokens.css`, `src/index.css` |
| Customer dependencies | `src/features/customer/BookingWizard.jsx`, `BookingDetailPage.jsx`, `BookingsListPage.jsx`, `CustomerDashboard.jsx`, `SupportTicketPage.jsx`, `DisputeFilingPage.jsx` |
| Admin dependencies | `src/features/admin/ProviderModerationPage.jsx`, `ListingModerationPage.jsx`, `BookingInspectorPage.jsx`, `AdminRevenuePage.jsx`, `AdminDashboard.jsx`, `TicketResolutionPage.jsx`, `DisputeAssignmentPage.jsx` |
| Arbitrator dependencies | `src/features/arbitrator/ArbitratorDashboard.jsx`, `DisputeCaseDetailPage.jsx`, `HearingSchedulerPage.jsx`, `RulingIssuancePage.jsx` |
| Marketplace reads | `src/features/public/ServiceDetailPage.jsx`, `ServiceSearchPage.jsx`, `LandingPage.jsx` |
| Routing | `src/app/routes/AppRoutes.jsx`: loads the homepage separately so it does not inflate the Provider entry bundle |
| Tests/report | `src/features/provider/provider.test.mjs`, `provider.e2e.mjs`, `provider.edges.e2e.mjs`, `PROVIDER_AUDIT.md` |

`src/features/provider/useProviderQuery.js` was removed after moving its useful reader logic to the shared `useRepositoryQuery.js`. Duplicate financial/date/slot logic, unused imports, redundant preflight reads, invented evidence defaults, fake success handlers and obvious comments were removed. Provider CSS is scoped to its workspace. Shared status text uses theme tokens. `App.css` did not need changes.

## E. Former teammate dependencies

All previously documented dependencies needed by the Provider demonstration have been implemented: canonical profiles/moderation, weekly scheduling/conflicts, proposals/customer consent, visibility, reviews/replies, cash/refunds, transition enforcement, correct support/dispute metadata, ruling outcomes/notifications, read state/live readers, and shared form/dialog accessibility.

No teammate ownership mapping is needed. The other role changes support Provider workflows; this was not a full audit of every Customer, Admin, Arbitrator or public feature.

## F. Final verification

| Check actually executed | Result |
| --- | --- |
| `node --test src/features/provider/provider.test.mjs` | 29 passed, 0 failed |
| Production Chromium presentation suite | 24 checks passed, no runtime errors or console warnings |
| Development Chromium edge suite, React Strict Mode | 11 checks passed, no runtime errors or console warnings |
| `npm run build` | Passed with Vite 8.2.1; no chunk-size warning |
| `git diff --check` | Passed |
| Package and seed inspection | Package files and `src/data/mockData.js` unchanged |

Tests use fresh, disposable Chromium contexts or in-memory localStorage. No existing user browser data was reset. Images were intercepted with harmless SVG responses; the edge suite also stubs external font CSS. External image and font hosting availability were excluded. Browser scripts use the existing bundled Playwright runtime without changing package dependencies.

To repeat:

```sh
node --test src/features/provider/provider.test.mjs
npm run build
npm run preview -- --host 127.0.0.1 --port 5186 --strictPort
```

In another terminal, set `PLAYWRIGHT_MODULE` to your installed or bundled Playwright module and run `node src/features/provider/provider.e2e.mjs`. The edge suite uses the development server at port 5187: `npm run dev -- --host 127.0.0.1 --port 5187 --strictPort`, then `node src/features/provider/provider.edges.e2e.mjs`. `TEST_BASE_URL` overrides either default URL. Test summaries and screenshots are written to `/private/tmp`.

Limits: this remains a frontend demo with localStorage persistence and demo role identities. KYC, evidence uploads, video meetings, notifications outside the app, authentication security and real payments/refunds require real services. Safari/Firefox and other team members' unrelated pages were not comprehensively tested.

## G. Presentation and viva guide

1. Sign in as Provider (`rohan@gmail.com`, `123456Ab@`). Show the dashboard and explain how counts and completed earnings come from bookings.
2. Edit the profile, save and reload. To demonstrate verification, enter a demo filename, submit, switch to Admin using SuperUser, enter feedback and approve, then return to Provider.
3. Create a listing with complete details and valid slots. Show its private draft preview, publish it, then demonstrate pause and republish.
4. Save weekly hours, a buffer and a blackout. Choose a future working day for the demonstration; seed bookings are historical and past dates are intentionally unavailable.
5. As Customer (`aarav@gmail.com`, same password), discover the listing and book a slot. Return to Provider and show the new request and notification.
6. Propose another available time. As Customer, accept it. Return to Provider, start work, enter completion notes and complete the job.
7. Show completed net earnings and the same fee/net values in Admin. Demonstrate a second declined request to show refund and slot release, or cash payment to show pending versus recorded collection.
8. As Customer, submit a review. As Provider, reply. Show the reply on the Customer booking and public service page.
9. File a dispute for the completed booking. As Provider, save a response and optional filename record. As Admin, assign the case; as Arbitrator (`kabir@gmail.com`, same password), enter a future hearing and meeting URL, then a ruling. Return to Provider to show notifications and the resulting earnings/refund.
10. Open notifications, navigate to a job, mark all read and press Escape. Show the same workflow in a narrow viewport or dark theme.

The code path to explain is **page event → repository operation → localStorage save → data-change event → subscribed page refresh**. `scheduling.js` is pure date/time and overlap logic; `bookingRules.js` defines paid/accepted states and refund arithmetic; `mockRepository.js` validates and saves; `useRepositoryQuery.js` handles loading, errors, retry and stale-request cleanup; `AppContext.jsx` holds the current demo role/profile, theme, notifications and toast. React state handles temporary edits while saved records remain in the repository.
