import { defineConfig } from "@playwright/test";
const apiPort = Number(process.env.TEST_API_PORT || 3001);
const frontendPort = Number(process.env.TEST_FRONTEND_PORT || 5174);
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const apiUrl = `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  testDir: "./tests",
  outputDir: `test-results/${process.env.TEST_BROWSER || 'chromium'}${process.env.TEST_PREVIEW === 'true' ? '-production' : ''}`,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    browserName: process.env.TEST_BROWSER || 'chromium',
    baseURL: frontendUrl,
    timezoneId: "Asia/Kolkata",
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: [
    {
      command:
        "npm --prefix backend run build && npm --prefix backend run test:serve",
      url: `${apiUrl}/api/v1/health`,
      timeout: 60000,
      reuseExistingServer: false,
    },
    {
      command: process.env.TEST_PREVIEW === 'true'
        ? `npm run build && npm run preview -- --host 127.0.0.1 --port ${frontendPort} --strictPort`
        : `npm run dev -- --host 127.0.0.1 --port ${frontendPort} --strictPort`,
      url: frontendUrl,
      env: { API_PROXY: apiUrl },
      reuseExistingServer: false,
    },
  ],
});
