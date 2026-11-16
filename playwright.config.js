import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  outputDir: `test-results/${process.env.TEST_BROWSER || 'chromium'}${process.env.TEST_PREVIEW === 'true' ? '-production' : ''}`,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    browserName: process.env.TEST_BROWSER || 'chromium',
    baseURL: "http://127.0.0.1:5174",
    timezoneId: "Asia/Kolkata",
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: [
    {
      command:
        "npm --prefix backend run build && npm --prefix backend run test:serve",
      url: "http://127.0.0.1:3001/api/v1/health",
      timeout: 60000,
      reuseExistingServer: false,
    },
    {
      command: process.env.TEST_PREVIEW === 'true'
        ? "npm run build && npm run preview -- --host 127.0.0.1 --port 5174 --strictPort"
        : "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      env: { API_PROXY: "http://127.0.0.1:3001" },
      reuseExistingServer: false,
    },
  ],
});
