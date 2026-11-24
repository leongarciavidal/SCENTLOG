import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests. They need the local Supabase stack running
 * (`npm run db:start`) because they create real users and read the
 * confirmation emails from Mailpit (http://127.0.0.1:54324).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/en",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
