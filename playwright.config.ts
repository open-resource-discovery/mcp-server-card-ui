import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e/tests",
  globalSetup: "./e2e/global-setup.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 15000,
  },

  expect: {
    timeout: 15000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "vite",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:5173",
      },
    },
    {
      name: "docusaurus",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
  webServer: [
    {
      command: "npm run dev",
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "cd website && npx docusaurus start --port 3000",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
