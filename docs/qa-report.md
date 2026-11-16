# ServiceHub QA report

Date: 16 November 2026. Branch: `servicehub-backend`.

## Verified results

| Check | Result |
|---|---|
| Frontend API/session/scheduling unit tests | 13 passed |
| Backend finance unit tests | 11 passed |
| PostgreSQL API integration tests | 37 passed |
| Chromium 159, including the production frontend bundle | 25 unique browser scenarios verified |
| Firefox 159 | 25 unique browser scenarios verified |
| WebKit 27.2 | 25 unique browser scenarios verified |
| Responsive route checks | 43 routes × 5 widths × 3 engines = 645 passed |
| Mobile checkout text/layout checks | 4 states × 3 widths × 3 engines = 36 passed |
| Automated light/dark accessibility | 43 routes × 2 themes × 3 engines = 258 scans with no violations |
| Frontend production build and backend TypeScript build | Passed |
| Local development frontend and API health | HTTP 200; homepage loads without JavaScript errors |
| Whitespace/error-marker diff check | Passed |

Browser results combine the complete route/accessibility tours with targeted
workflow reruns after each correction. The final affected workflow checks pass
in all three engines; repeated runs are not counted as additional scenarios.
The production Chromium run uses the compiled frontend and compiled backend.
Tests ran on Node.js 24.18.0 with Playwright 1.65.1 and PostgreSQL 17.

## Scope and isolation

The checks use the real NestJS API, Prisma, and PostgreSQL. API and browser suites
reset only `servicehub_test`; the development database is not reset. Test servers
use ports 3001 and 5174. Suites sharing that database must run sequentially.

The browser inventory covers 43 public, customer, provider, administrator, and
arbitrator routes. Each route is checked at 320, 375, 414, 768, and 1440 pixels,
after loading finishes. The checks reject document overflow, visible elements
outside the viewport, JavaScript errors, and unexpected failed API requests.
Tables intentionally scroll within their own keyboard-focusable containers.

Accessibility checks run axe WCAG 2 A/AA and 2.1 AA rules on every route in both
light and dark themes: 86 page/theme scans per browser. These scans use reduced
motion so temporary animation frames do not produce unstable contrast results. Additional workflow tests
exercise keyboard focus trapping, Escape, focus restoration, mobile navigation,
notifications, and theme persistence. Representative desktop and mobile
screenshots are also inspected visually.
The booking wizard is additionally checked at 320, 375, and 414 pixels in its
address, price-review, electronic-payment, and cash-payment states, including
text containment within buttons.

## Functional coverage

- Signup and validation for customers and providers; address persistence;
  arbitrator document upload, application approval/rejection, and login.
- Authentication, password hashing, rotating cookies, refresh replay rejection,
  concurrent refresh, logout, role/ownership enforcement, demo authorization,
  actor switching, CORS, tampered tokens, rate limits, and production demo guards.
- Catalog search/filter/sort isolation, pagination, listing validation,
  publication, pause/archive behavior, and provider verification.
- Booking creation and checkout, authoritative prices and historical snapshots,
  idempotency, availability, blackout dates, lead/buffer times, rescheduling,
  provider acceptance/start/completion, reviews, and provider replies.
- Twelve simultaneous booking attempts for one provider/slot must produce
  exactly one booking. Financial checks cover rounding, fees, refunds, cash
  completion, repeated requests, and balanced totals.
- Tickets, redo/warning/escalation, duplicate dispute prevention, assignment,
  private evidence access after reassignment, file type/size rejection, hearings,
  ruling persistence, refund caps, and prevention of repeated rulings.
- Profile/address edits, custom requests, notifications, failed API recovery,
  empty results, missing records, migrations, repeat seeding, and health/Swagger.

## Corrections made during QA

- Copied the public listing filter before applying request-specific price filters,
  preventing one search from restricting subsequent requests.
- Rejected explicit null updates, malformed pagination, and invalid related IDs
  with client errors rather than unexpected server failures.
- Consolidated role layouts into a shared responsive shell and added mobile
  navigation to public and authenticated pages. Cards, grids, controls, dialogs,
  footers, and toast messages now adapt to narrow viewports.
- Fixed missing form labels, invalid ARIA attributes, keyboard-inaccessible table
  scrolling, focus styling, and low-contrast text in both themes.
- Made dialog openers receive focus consistently in Safari/WebKit so Escape
  returns focus correctly. Narrow checkout actions stack at full width and the
  cash-payment confirmation label wraps inside its button.
- Added service-photo fallbacks and replaced fabricated homepage totals with
  values derived from the catalog.
- Fixed actor-switch/logout routing races and allowed the rotating-cookie refresh
  response to finish when navigation interrupts page restoration. Bounded retries
  allow the preceding page’s cookie to arrive; stale refresh results cannot clear
  a newer login. Server-side refresh replay rejection remains enforced.
- Hearing and ruling pages now select real assigned cases, handle loading/errors
  and empty assignments, and show a persisted ruling after reload.
- Updated vulnerable frontend development dependencies. Overrode backend
  development `glob` and `minimatch` to patched versions and exercised the Jest
  runner and coverage collector with those versions.

## Reproduce

Follow the database setup in the root README, then run from the repository root:

```sh
export TEST_DATABASE_URL='postgresql://servicehub:servicehub_dev@localhost:5432/servicehub_test'
npm test
npm --prefix backend test
npm --prefix backend run test:e2e
npx playwright install chromium firefox webkit
npm run test:e2e
TEST_BROWSER=firefox npm run test:e2e
TEST_BROWSER=webkit npm run test:e2e
TEST_PREVIEW=true npm run test:e2e
npm run build
npm --prefix backend run build
npm audit
npm --prefix backend audit --omit=dev
npm --prefix backend audit
```

`TEST_PREVIEW=true` builds and serves the production frontend bundle against the
compiled test backend. Browser JSON reports, screenshots, and failure traces are
stored under `test-results/<browser>/` or `<browser>-production/`.

The browser launcher increases test-only rate limits to support repeated login
and route scans. API integration tests retain normal rate limits and assert 429.

## Remaining limitations

- The full frontend audit and the backend runtime audit report zero known
  vulnerabilities. The full backend audit reports six low-severity affected
  dependency entries, all from one unpatched development-only
  [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) through
  Jest configuration. There are no moderate, high, or critical audit findings.
  No forced Jest downgrade was applied.
- Vite reports a roughly 598 kB main JavaScript chunk (about 148 kB gzip).
  The Prisma PostgreSQL adapter emits a query-concurrency deprecation warning
  with pg 8. These warnings do not fail the builds or exercised workflows.
- Browser checks use desktop browser engines with viewport resizing, not physical
  iOS/Android devices. Automated accessibility checks are not a complete manual
  assistive-technology audit. No sustained production load/soak test was performed.
- Payments remain simulated. Real email delivery, password recovery, external
  payment gateways, and production hosting are outside the implemented scope.
  Passing these checks is evidence for the covered cases, not a guarantee that
  every possible input or environment is free of defects.
