const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL must point to a dedicated database whose name ends in _test.');
}

const uploads = mkdtempSync(join(tmpdir(), 'servicehub-test-uploads-'));
const env = {
  ...process.env,
  DATABASE_URL: url,
  NODE_ENV: 'test',
  DEMO_ENABLED: 'true',
  JWT_SECRET: 'integration-tests-only-secret-at-least-32-characters',
  UPLOAD_DIR: uploads,
};
try {
  for (const args of [
    ['prisma', 'generate'],
    ['prisma', 'migrate', 'deploy'],
    ['jest', '--runInBand', '--config', 'test/jest-e2e.json'],
  ]) {
    const result = spawnSync('npx', args, { env, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
  }
} finally {
  rmSync(uploads, { recursive: true, force: true });
}
