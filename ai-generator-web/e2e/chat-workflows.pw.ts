import { expect, test, type BrowserContext, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

async function chatFixture(context: BrowserContext, page: Page) {
    const user = { id: '12345678-1111-4111-8111-123456789abc', email: 'chat@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
    const profile = { ...user, name: 'Chat', last_name: 'Tester', username: 'chat-test', role: 'user', accreditations: [1, 2] };
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, exp, role: 'authenticated' })).toString('base64url')}.fixture`;
    const session = { user, access_token: token, refresh_token: 'fixture-refresh', token_type: 'bearer', expires_in: 3600, expires_at: exp };
    const state = { messages: [] as Record<string, unknown>[], failMessages: false, failMessageWrites: false, invalidTemporaryRequests: 0 };
    await context.route('**/auth/v1/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(route.request().url().includes('/user') ? user : session) }));
    await context.route('**/rest/v1/**', async route => {
        const request = route.request();
        const url = new URL(request.url());
        const table = url.pathname.split('/').at(-1);
        const method = request.method();
        if (table === 'messages' && (state.failMessages || (state.failMessageWrites && method !== 'GET'))) return route.abort('failed');
        const id = url.searchParams.get('id')?.replace(/^eq\./, '');
        if (table === 'messages' && id?.startsWith('temp_')) {
            state.invalidTemporaryRequests++;
            return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: '22P02', message: 'invalid UUID', details: null, hint: null }) });
        }
        let rows: Record<string, unknown>[] = table === 'profiles' ? [profile] : table === 'messages' ? [...state.messages] : [];
        if (table === 'messages' && method === 'POST') {
            const body = request.postDataJSON();
            const values = Array.isArray(body) ? body[0] : body;
            const row = { ...values, id: `87654321-1111-4111-8111-${String(state.messages.length + 1).padStart(12, '0')}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_edited: false, user: profile };
            state.messages.push(row);
            rows = [row];
        } else if (table === 'messages' && method === 'PATCH') {
            state.messages = state.messages.map(row => row.id === id ? { ...row, ...request.postDataJSON() } : row);
            rows = state.messages.filter(row => row.id === id);
        } else if (table === 'messages' && method === 'DELETE') {
            state.messages = state.messages.filter(row => row.id !== id);
            return route.fulfill({ status: 204 });
        }
        if (id) rows = rows.filter(row => row.id === id);
        if (table === 'messages' && method === 'GET') rows.reverse();
        const single = request.headers().accept?.includes('vnd.pgrst.object');
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(single ? rows[0] ?? null : rows) });
    });
    await context.route('**/storage/v1/**', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
    await context.routeWebSocket(/\/realtime\/v1\//, () => {});
    await page.goto('/login');
    await page.locator('#identifier').fill(user.email);
    await page.locator('#password').fill('fixture-password');
    await page.getByRole('button', { name: 'Prijava', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/chat');
    await expect(page.getByPlaceholder('Unesite poruku...')).toBeVisible();
    return state;
}

test('chat persists send, edit and confirmed delete, while cancel preserves the message', async ({ context, page }) => {
    const state = await chatFixture(context, page);
    const input = page.getByPlaceholder('Unesite poruku...');
    await input.fill('Poruka za provjeru');
    await input.press('Enter');
    await expect(input).toHaveValue('');
    await expect(page.getByText('Poruka za provjeru', { exact: true })).toHaveCount(1);
    expect(state.messages).toHaveLength(1);
    await page.getByTitle('Uredi', { exact: true }).click();
    await page.locator('textarea').first().fill('Uređena poruka');
    await page.getByRole('button', { name: 'Spremi', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Uredi', exact: true })).toHaveCount(0);
    await expect(page.getByText('Uređena poruka', { exact: true })).toBeVisible();
    expect(state.messages[0].content).toBe('Uređena poruka');
    await page.reload();
    await expect(page.getByText('Uređena poruka', { exact: true })).toBeVisible();
    await page.getByTitle('Obriši', { exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Odustani', exact: true }).click();
    expect(state.messages).toHaveLength(1);
    await page.getByTitle('Obriši', { exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Potvrdi', exact: true }).click();
    await expect(page.getByText('Uređena poruka', { exact: true })).toHaveCount(0);
    expect(state.messages).toHaveLength(0);
    await expect(input).toHaveAttribute('maxlength', '5000');
    await expect(page.getByRole('button', { name: 'Pošalji', exact: true })).toBeDisabled();
});

test('queued chat messages survive successful empty reads and remain editable after synchronization', async ({ context, page }) => {
    const state = await chatFixture(context, page);
    state.failMessageWrites = true;
    const input = page.getByPlaceholder('Unesite poruku...');
    await input.fill('Čekanje sinkronizacije');
    await input.press('Enter');
    await expect(input).toHaveValue('');
    await page.reload();
    await expect(page.locator('p').getByText('Čekanje sinkronizacije', { exact: true })).toBeVisible();
    state.failMessageWrites = false;
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect.poll(() => state.messages.length).toBe(1);
    await page.getByTitle('Uredi', { exact: true }).click();
    await page.getByRole('textbox', { name: 'Uredi', exact: true }).fill('Sinkronizirana i uređena');
    await page.getByRole('button', { name: 'Spremi', exact: true }).click();
    await expect.poll(() => state.messages[0]?.content).toBe('Sinkronizirana i uređena');
    await page.getByTitle('Obriši', { exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Potvrdi', exact: true }).click();
    await expect.poll(() => state.messages.length).toBe(0);
    expect(state.invalidTemporaryRequests).toBe(0);
});

test('chat preserves failed network sends and edits/deletes temporary messages without remote UUID requests', async ({ context, page }) => {
    const state = await chatFixture(context, page);
    state.failMessages = true;
    const input = page.getByPlaceholder('Unesite poruku...');
    await input.fill('Poruka bez veze');
    await input.press('Enter');
    await expect(input).toHaveValue('');
    await expect(page.getByText('Poruka bez veze', { exact: true })).toBeVisible();
    expect(state.messages).toHaveLength(0);
    // The network is restored, but the queued message still has a temporary ID.
    state.failMessages = false;
    await page.getByTitle('Uredi', { exact: true }).click();
    await page.locator('textarea').first().fill('Promjena prije sinkronizacije');
    await page.getByRole('button', { name: 'Spremi', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Uredi', exact: true })).toHaveCount(0);
    await expect(page.getByText('Promjena prije sinkronizacije', { exact: true })).toBeVisible();
    expect(state.invalidTemporaryRequests).toBe(0);
    await page.getByTitle('Obriši', { exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Potvrdi', exact: true }).click();
    await expect(page.getByText('Promjena prije sinkronizacije', { exact: true })).toHaveCount(0);
    expect(state.invalidTemporaryRequests).toBe(0);
});

test('a newer online chat edit supersedes an older queued edit after network recovery', async ({ context, page }) => {
    const state = await chatFixture(context, page);
    const input = page.getByPlaceholder('Unesite poruku...');
    await input.fill('Izvorna poruka');
    await input.press('Enter');
    await expect(input).toHaveValue('');
    await expect.poll(() => state.messages.length).toBe(1);
    state.failMessageWrites = true;
    await page.getByTitle('Uredi', { exact: true }).click();
    await page.getByRole('textbox', { name: 'Uredi', exact: true }).fill('Starija promjena u redu');
    await page.getByRole('button', { name: 'Spremi', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Uredi', exact: true })).toHaveCount(0);
    await expect(page.getByText('Starija promjena u redu', { exact: true })).toBeVisible();
    expect(state.messages[0].content).toBe('Izvorna poruka');

    state.failMessageWrites = false;
    await page.getByTitle('Uredi', { exact: true }).click();
    await page.getByRole('textbox', { name: 'Uredi', exact: true }).fill('Najnovija potvrđena promjena');
    await page.getByRole('button', { name: 'Spremi', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Uredi', exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('Najnovija potvrđena promjena', { exact: true })).toBeVisible();
    expect(state.messages[0].content).toBe('Najnovija potvrđena promjena');
});
