import { expect, test } from '@playwright/test';

test('authenticated pages load with an empty account', async ({ context, page }) => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const user = { id: userId, email: 'inspector@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
    const profile = { ...user, name: 'Test', last_name: 'Inspector', username: 'inspector', role: 'admin', accreditations: [1, 2] };
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt, role: 'authenticated' })).toString('base64url')}.test-signature`;
    const session = { user, access_token: accessToken, refresh_token: 'test-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: expiresAt };
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    // All account responses are fixtures; this smoke test never writes remote data.
    await context.route('**/auth/v1/**', route => route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(route.request().url().includes('/user') ? user : session),
    }));
    await context.route('**/rest/v1/**', route => {
        const url = new URL(route.request().url());
        const table = url.pathname.split('/').at(-1);
        const rows = table === 'profiles' ? [profile] : table === 'user_sessions' ? [{ id: 'test-device-session', user_id: userId }] : [];
        const single = route.request().headers().accept?.includes('vnd.pgrst.object');
        return route.fulfill({
            contentType: 'application/json',
            headers: { 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` },
            body: JSON.stringify(single ? rows[0] ?? null : rows),
        });
    });
    await context.route('**/storage/v1/**', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
    await context.routeWebSocket(/\/realtime\/v1\//, () => {});

    await page.goto('/login');
    await page.locator('#identifier').fill(user.email);
    await page.locator('#password').fill('test-password-123');
    await page.getByRole('button', { name: 'Prijava', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);

    for (const path of ['/', '/customers', '/customers/new', '/reports', '/reports/new', '/reports/new/air', '/history', '/examiners', '/analytics', '/profile', '/chat', '/calendar', '/settings', '/help']) {
        await test.step(path, async () => {
            await page.goto(path);
            await expect(page.locator('main').getByRole('heading').first()).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Došlo je do greške', exact: true })).toHaveCount(0);
        });
    }
    expect(errors).toEqual([]);
});
