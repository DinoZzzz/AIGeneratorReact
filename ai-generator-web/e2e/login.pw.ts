import { expect, test } from '@playwright/test';

test.describe('Login recovery', () => {
    test('falls back to Croatian for an unsupported stored language', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('language', 'unsupported'));
        await page.goto('/login');
        await expect(page.getByRole('button', { name: 'Prijava', exact: true })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', 'hr');
    });

    test('shows failed login feedback and allows another attempt', async ({ page }) => {
        const submittedEmails: string[] = [];
        await page.route('**/auth/v1/token?grant_type=password', async route => {
            submittedEmails.push(route.request().postDataJSON().email);
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ code: 'invalid_credentials', message: 'Invalid login credentials' }),
            });
        });
        await page.goto('/login');
        await page.locator('#identifier').fill('  inspector@example.com  ');
        await page.locator('#password').fill('invalid-test-password');
        const submit = page.getByRole('button', { name: 'Prijava', exact: true });
        await submit.click();
        await expect(page.getByRole('alert')).toContainText('Neispravni podaci');
        await expect(submit).toBeEnabled();
        await submit.click();
        await expect.poll(() => submittedEmails.length).toBe(2);
        expect(submittedEmails).toEqual(['inspector@example.com', 'inspector@example.com']);
        await expect(submit).toBeEnabled();
    });
});
