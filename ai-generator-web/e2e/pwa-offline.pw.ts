import { expect, test } from '@playwright/test';

const MODULE_LOAD_FAILURE_PATTERN = /importing a module script failed|failed to import module script|failed to fetch dynamically imported module|error loading dynamically imported module/i;

const collectErrorSignals = (
  pageErrors: string[],
  consoleErrors: string[]
): string[] => [...pageErrors, ...consoleErrors];

test.describe('PWA Offline Smoke', () => {
  test('stays stable through online -> offline -> online transition', async ({ context, page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message || String(error));
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Prijava', exact: true })).toBeVisible();

    const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
    test.skip(!swSupported, 'Service worker is not supported in this browser environment.');

    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    // The first page may predate installation; navigate under the active worker.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await expect.poll(
      async () => page.evaluate(() => navigator.onLine),
      { timeout: 10_000 }
    ).toBe(false);

    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Prijava', exact: true })).toBeVisible();
    expect(await page.evaluate(async () => (await fetch('/pdf.worker.min.mjs')).ok)).toBe(true);

    await context.setOffline(false);
    await expect.poll(
      async () => page.evaluate(() => navigator.onLine),
      { timeout: 10_000 }
    ).toBe(true);

    const errorSignals = collectErrorSignals(pageErrors, consoleErrors);
    const moduleImportErrors = errorSignals.filter((message) => MODULE_LOAD_FAILURE_PATTERN.test(message));
    expect(moduleImportErrors).toHaveLength(0);
  });

  test('deep-link reports route does not trigger module import failure', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message || String(error));
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto(
      '/customers/ff64bb7a-cc24-4ffd-8cc7-d8f1c985588a/constructions/de344bbb-f20a-41e4-8357-5df78cd970eb/reports',
      { waitUntil: 'domcontentloaded' }
    );
    await expect(page.getByRole('button', { name: 'Prijava', exact: true })).toBeVisible();

    const errorSignals = collectErrorSignals(pageErrors, consoleErrors);
    const moduleImportErrors = errorSignals.filter((message) => MODULE_LOAD_FAILURE_PATTERN.test(message));
    expect(moduleImportErrors).toHaveLength(0);
  });
});
