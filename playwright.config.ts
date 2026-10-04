import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npx next start -p 3100",
    port: 3100,
    reuseExistingServer: false,
    env: {
      STAFF_PASSWORD: "playwright-staff-password",
      STAFF_SESSION_SECRET: "playwright-session-secret-at-least-32-characters",
      // Fresh in-memory Postgres per run; no Gemini key, so the fallback parser is exercised.
      PGLITE_DIR: "memory://",
      DEMO_ACCESS_CODE: "playwright-demo-code",
      GEMINI_API_KEY: "",
    },
    timeout: 120_000,
  },
});
