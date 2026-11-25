# ServiceHub — Full-Stack Marketplace (React 19 + Redux Toolkit + NestJS + PostgreSQL)

ServiceHub is a full-stack non-retail services marketplace localized for India (`₹` INR currency, `+91` 10-digit phone numbers, Indian PIN codes, and `Asia/Kolkata` scheduling). It connects **Customers**, **Service Providers**, **Platform Admins**, and **Independent Arbitrators** with end-to-end discovery, step-based checkout, availability scheduling, job execution, support triage, financial ledger tracking, and formal dispute arbitration.

---

## 1. Architecture Overview

### 1:1 Repository-to-Redux-Slice Mapping

Every backend domain module/repository in `server/src/modules/` maps **1:1** to a frontend API repository in `src/repositories/` and a Redux Toolkit slice in `src/store/slices/`, enforcing a strict **pessimistic thunk pattern** (`UI -> Thunk -> Repository/API -> NestJS -> PostgreSQL -> 2xx Response -> .fulfilled Reducer -> Redux Store -> UI`):

| # | Domain | NestJS Module & Repo (`server/src/modules/`) | Frontend Repo (`src/repositories/`) | Redux Slice (`src/store/slices/`) |
|---|---|---|---|---|
| 1 | **Auth & Session** | `auth` (`AuthRepository`) | `authRepository.js` | `authSlice.js` |
| 2 | **Users & Profiles** | `users` (`UsersRepository`) | `usersRepository.js` | `usersSlice.js` |
| 3 | **Services & Categories** | `marketplace` (`MarketplaceRepository`) | `marketplaceRepository.js` | `marketplaceSlice.js` |
| 4 | **Bookings & Scheduling** | `bookings` (`BookingsRepository`) | `bookingsRepository.js` | `bookingsSlice.js` |
| 5 | **Finance & Ledger** | `finance` (`FinanceRepository`) | `financeRepository.js` | `financeSlice.js` |
| 6 | **Support & Disputes** | `governance` (`GovernanceRepository`) | `governanceRepository.js` | `governanceSlice.js` |
| 7 | **Notifications** | `notifications` (`NotificationsRepository`) | `notificationsRepository.js` | `notificationsSlice.js` |
| 8 | **Platform & Audit** | `platform` (`PlatformRepository`) | `platformRepository.js` | `platformSlice.js` |

*(Ephemeral UI-only preferences such as theme and toast notifications live in `src/store/slices/uiSlice.js`.)*

---

## 2. Prerequisites & Environment Variables

- **Node.js**: v20+ (tested on Node v24)
- **PostgreSQL**: PostgreSQL 15+ (native Windows PostgreSQL, WSL2 Ubuntu PostgreSQL, or any hosted PostgreSQL)

### Environment Files
- **Frontend (`.env` at project root)**: Copy from `.env.example`
  ```env
  VITE_API_BASE_URL=http://localhost:4000/api
  ```
- **Backend (`server/.env`)**: Copy from `server/.env.example`
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/servicehub?schema=public"
  JWT_SECRET="servicehub-dev-jwt-secret-change-in-production"
  JWT_EXPIRES_IN="7d"
  PORT=4000
  CORS_ORIGIN="http://localhost:5173"
  ENABLE_DEMO_SWITCHER="true"
  ```

---

## 3. Setup & Execution Steps

### Step 1: Ensure PostgreSQL is Running
Make sure PostgreSQL is running on port `5432` with a database named `servicehub` matching `DATABASE_URL` in `server/.env`:
- **Windows / Local PostgreSQL**: Start the PostgreSQL service and create the `servicehub` database.
- **WSL2 Ubuntu PostgreSQL**: `wsl -d Ubuntu -u root -- service postgresql start`

### Step 2: Setup & Start NestJS Backend (`/server`)
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run start:dev
```
The NestJS API will listen on `http://localhost:4000/api`.

### Step 3: Start Frontend (Vite + React + Redux Toolkit)
From the repository root:
```bash
npm install
npm run dev
```
The SPA will be accessible at `http://localhost:5173`.

---

## 4. Builds & Automated Tests

### Frontend Build & Redux Architecture Tests
From the repository root:
```bash
npm run build
node --test "src/store/redux-architecture.test.mjs"
```

### Backend Build & Domain Rules Tests
From `server/`:
```bash
npm run build
npx tsx --test src/domain-rules.spec.ts
```

---

## 5. Seeded Demo Accounts (Password: `123456Ab@`)

- **Customer**: `aarav@gmail.com` (`Aarav Mehta`)
- **Service Provider**: `rohan@gmail.com` (`Rohan Verma` — `UrbanFix Home Solutions`)
- **SuperUser Admin**: `admin@gmail.com` (`Naina Kapoor` — enables global Demo Switcher)
- **Staff Admin**: `staffadmin@gmail.com` (`Priya Nair`)
- **Arbitrator**: `kabir@gmail.com` (`Kabir Malhotra`)
- **Reset Demo Database**: Triggered from the Demo Switcher bar (`POST /api/platform/reset-demo`) to re-seed PostgreSQL cleanly.
