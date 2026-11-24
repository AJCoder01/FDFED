require('dotenv/config');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL must end in _test.');
}

const uploads = mkdtempSync(join(tmpdir(), 'servicehub-browser-uploads-'));
process.on('exit', () => rmSync(uploads, { recursive: true, force: true }));
Object.assign(process.env, {
  DATABASE_URL: url,
  NODE_ENV: 'test',
  AUTH_RATE_LIMIT: '1000',
  SIGNUP_RATE_LIMIT: '1000',
  API_RATE_LIMIT: '5000',
  PORT: process.env.TEST_API_PORT || '3001',
  CORS_ORIGIN: `http://127.0.0.1:${process.env.TEST_FRONTEND_PORT || '5174'}`,
  DEMO_ENABLED: 'true',
  JWT_SECRET: 'browser-tests-only-secret-at-least-32-characters',
  UPLOAD_DIR: uploads,
});

const migration = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
if (migration.error) throw migration.error;
if (migration.status !== 0) process.exit(migration.status ?? 1);

const { Database } = require('../dist/src/common/database');
const { seedData, clearDemoDatabase } = require('../dist/prisma/seed-data');
async function start() {
  const db = new Database();
  try {
    await db.$transaction(async tx => {
      await clearDemoDatabase(tx);
      await seedData(tx);
    }, { timeout: 60000 });
  } finally {
    await db.$disconnect();
  }
  require('../dist/src/main');
}
start().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
