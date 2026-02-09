import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';
const useLocalPreview = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: useLocalPreview ? {
    command: 'npm run preview -- --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  } : undefined,
});
