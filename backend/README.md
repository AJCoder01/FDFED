# ServiceHub backend

See [root setup instructions](../readme.md) and [API contract](../docs/backend-contract.md).

Use `npm run prisma:generate`, `npm run db:migrate`, then `npm run db:seed` in
development. `npm run dev` starts the API; `npm run build` and `npm start` run
compiled output. The PostgreSQL integration suite uses `TEST_DATABASE_URL` and
never the development `DATABASE_URL`.

The browser test launcher raises `AUTH_RATE_LIMIT`, `SIGNUP_RATE_LIMIT`, and
`API_RATE_LIMIT` for its isolated server to allow repeated test logins and route
scans. Normal defaults remain 10 logins, 5 signups, and 300 API requests per
minute; the API integration suite tests those defaults, including HTTP 429.

Development dependency overrides pin patched major ranges for `glob` and
`minimatch` until Jest's dependencies adopt them. Unit tests, coverage collection,
and the PostgreSQL integration suite verify compatibility. The remaining
`deepmerge` advisory has no patched release; see the root QA report.
