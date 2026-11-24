# ServiceHub backend

See [root setup instructions](../readme.md) and [API contract](../docs/backend-contract.md).

Use `npm run prisma:generate`, `npm run db:migrate`, and `npm run db:seed` to
set up development data.
`npm run dev` and `npm run build` generate the Prisma client automatically.
`npm start` runs compiled output. The PostgreSQL integration suite uses
`TEST_DATABASE_URL`.

The browser test launcher raises `AUTH_RATE_LIMIT`, `SIGNUP_RATE_LIMIT`, and
`API_RATE_LIMIT` for its isolated server to allow repeated test logins and route
scans. Normal defaults remain 10 logins, 5 signups, and 300 API requests per
minute; the API integration suite tests those defaults, including HTTP 429.

Dependency overrides use patched `glob` and `minimatch` ranges for Jest and
Effect 3.22.1 for Prisma's configuration package. Prisma client generation,
migration deployment, and the PostgreSQL integration suite verify compatibility.
