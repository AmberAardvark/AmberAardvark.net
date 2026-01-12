import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4321',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Keep browser open with existing session */
    headless: false,
  },

  /* Configure projects for major browsers using system installations */
  projects: [
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Uses your Firefox profile with existing cookies
        // To find your profile path, go to about:profiles in Firefox
        launchOptions: {
          executablePath: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
          // Uncomment and update with your profile path:
          // args: ['-profile', 'C:\\Users\\YourUsername\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\xxxxxxxx.default-release'],
        },
      },
    },

    {
      name: 'edge',
      use: { 
        ...devices['Desktop Edge'],
        // Uses your system-installed Microsoft Edge
        // To use your existing profile with cookies:
        // 1. Close all Edge windows
        // 2. Launch Edge with: msedge.exe --remote-debugging-port=9222 --user-data-dir="C:\Users\YourUsername\AppData\Local\Microsoft\Edge\User Data"
        // 3. Then run your tests
        channel: 'msedge',
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
