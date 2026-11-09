import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @abrainoconscious/web dev:test',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'pnpm --filter @abrainoconscious/admin dev:test',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
