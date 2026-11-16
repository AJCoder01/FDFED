# ServiceHub

React/Vite marketplace with a NestJS REST API, Prisma and PostgreSQL. Customers,
providers, administrators and assigned arbitrators share persisted records.
All charges, payouts, refunds and arbitration awards are **simulations**;
no payment gateway transfers money.

## Local setup

Use Node.js 24 LTS, npm, and Docker Desktop (running). From the repository root:

```sh
npm ci
npm ci --prefix backend
cp .env.example .env
cp backend/.env.example backend/.env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Put the generated value in `JWT_SECRET` in `backend/.env`. Keep `.env` files private.
Then run:

```sh
docker compose up -d
npm --prefix backend run prisma:generate
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
npm --prefix backend run dev
```

In another terminal at the root:

```sh
npm run dev
```

Open [ServiceHub](http://localhost:5173). The frontend proxies `/api` to port 3000.
[Swagger](http://localhost:3000/api/docs) documents routes and request DTOs;
[health](http://localhost:3000/api/v1/health) checks the database connection.
`API_PROXY` overrides the Vite development proxy target. `VITE_API_URL` sets a
separate API base URL when needed. Add the frontend origin to `CORS_ORIGIN`.

Database records survive restarts. Refresh tokens use an HttpOnly, SameSite
cookie; access tokens live only in memory. Authentication is restored from the
API when the browser reloads. Only theme preferences use localStorage.

## Demo accounts

Development seed password: `123456Ab@` (override with `DEMO_PASSWORD` when seeding).

| Role | Email |
|---|---|
| Customer | aarav@gmail.com |
| Provider | rohan@gmail.com |
| Second provider | sparkle@example.test |
| Staff admin | staffadmin@gmail.com |
| Superuser admin | admin@gmail.com |
| Arbitrator | kabir@gmail.com |

`DEMO_ENABLED=true` permits seeding and superuser-controlled persona switching
outside production. `VITE_DEMO_ENABLED=true` shows credential helpers. Demo reset
requires a superuser-origin session and clears the **entire development application
database**, then reseeds it. It logs everyone out. Do not point demo mode at a
shared or production database. Production startup rejects `DEMO_ENABLED=true`.
Public signup creates only customers or unverified providers; arbitrators apply
with documents and a password and can log in after admin approval.

## Checks

```sh
npm run build
npm --prefix backend run build
npm test
npm --prefix backend test
```

Create an isolated database once (the integration runner refuses names without
an `_test` suffix):

```sh
docker compose exec -T postgres psql -U servicehub -d postgres -c 'CREATE DATABASE servicehub_test;'
export TEST_DATABASE_URL='postgresql://servicehub:servicehub_dev@localhost:5432/servicehub_test'
npm --prefix backend run test:e2e
npx playwright install chromium firefox webkit
npm run test:e2e
TEST_BROWSER=firefox npm run test:e2e
TEST_BROWSER=webkit npm run test:e2e
TEST_PREVIEW=true npm run test:e2e
```

The backend integration suite applies migrations and resets only the specified
test database. Playwright starts separate backend/frontend servers on ports
3001/5174 and resets the same test database. Run those suites sequentially.
The former browser-local mock tests have been replaced by API adapter,
scheduling, financial, PostgreSQL/Supertest, and browser tests.

See [the QA report](docs/qa-report.md) for test coverage, verified results,
UI corrections, dependency audits, and remaining limitations. Browser artifacts
are written under `test-results/<browser>/`; `TEST_PREVIEW=true` tests the built
frontend and writes to `test-results/<browser>-production/`.

## Structure

- `backend/prisma/schema.prisma`: users, sessions, addresses, provider
  profiles/schedules, categories/listings, bookings/timelines/proposals/reviews,
  payments/refunds, tickets/disputes/evidence/hearings/rulings,
  applications, notifications, audits, files and custom requests.
- `backend/prisma/migrations`: SQL migrations, foreign keys, indexes, and database
  checks for money, ratings, default addresses and one open dispute/proposal.
- `backend/src`: auth, users, marketplace, bookings, finance, support, platform and
  files modules. Controllers delegate to services; guards and services enforce
  server-derived identities.
- `src/data/apiClient.js` and `apiRepository.js`: HTTP/session handling
  and compatibility mapping for the existing React components.
- `docs/backend-contract.md`: endpoint, permission and frontend-operation mapping.

Provider-row locks serialize availability changes and booking mutations. A new
booking or accepted proposal rechecks availability inside the transaction.
Original appointments remain reserved during pending reschedules. Money uses
integer paise and the 5% fee rounds to the nearest paisa; booking snapshots retain
historical names, service prices, durations and addresses. Listing deletion
archives the record. Notifications, audits, timelines and financial updates
commit with booking/support operations.

## Files and deployment

Uploads accept PDF, PNG, JPEG and WebP, maximum 5 MB per file, with MIME/signature
checks and generated filenames. Public profile/listing images can be read without
a session. Private evidence requires the owner, a party to its case, its assigned
arbitrator or an administrator. Application documents are private to admins until
approval. Files reside in `UPLOAD_DIR`; back it up alongside PostgreSQL and use a
persistent disk. The file service is the boundary for a future object store.

Production needs its own PostgreSQL database, a random JWT secret, HTTPS reverse
proxy and exact CORS origins. Set `NODE_ENV=production`, `DEMO_ENABLED=false`, and
`VITE_DEMO_ENABLED=false`. Serve the built frontend and `/api` under the same site
for the Strict refresh cookie. The backend listens on loopback by default.
Run `npm --prefix backend run db:migrate` during deployment; run the built server
with `npm --prefix backend start`. Production administrators must be provisioned
through trusted database administration; public signup cannot create them.

## Deliberate changes and limits

- No password aliases, client-side role impersonation, email-based superuser
  detection, or boot-ID logout. API failures display errors without mock fallback.
- Provider signup starts at draft; admin approval is required before publication.
  The existing provider verification document field is a descriptive reference;
  it does not perform government identity or background verification.
- Historical seed evidence did not contain original bytes. Those files are not
  fabricated; seed cases have no downloadable evidence until actual uploads exist.
  The sample pending arbitrator application likewise has no original documents.
- Custom requests are saved and listed for their customer. Provider dispatch and
  a quotation marketplace are not implemented or promised in the UI.
- Awards are recorded separately from simulated refunds, which cannot exceed
  remaining recorded payment. Booking history remains a snapshot after profile edits.
- Category management remains the existing read-only directory. There is no real
  email delivery, password recovery, payment gateway, or object-storage deployment.
- Collection responses paginate; compatibility dashboards currently gather pages
  for their existing aggregate views. Large deployments should move those view
  aggregates into dedicated database queries.

Setup follows the [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma)
and [Prisma 7 setup](https://www.prisma.io/docs/guides/v7/frameworks/nestjs): explicit
client generation, the PostgreSQL driver adapter and `prisma.config.ts`.
