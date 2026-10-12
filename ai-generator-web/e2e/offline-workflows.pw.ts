import { expect, test, type BrowserContext, type Page } from '@playwright/test';

// Stateful HTTP fixtures keep the real SDK, React hooks and IndexedDB in the
// browser while ensuring these destructive workflows never reach live data.
type Row = Record<string, unknown>;
const aliceId = '11111111-1111-4111-8111-111111111111';
const bobId = '22222222-2222-4222-8222-222222222222';
const customerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const bobCustomerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const constructionId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

class OfflineBackend {
    offline = false;
    rejectLogout = false;
    rejectCustomerWrites = false;
    logoutRequests = 0;
    customerWrites: Row[] = [];
    rows = new Map<string, Row[]>([
        [aliceId, [{ id: customerId, name: 'Alice customer', work_order: 'AL-1', location: 'Zagreb', address: 'Ilica 1', postal_code: '10000', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }]],
        [bobId, [{ id: bobCustomerId, name: 'Bob customer', work_order: 'BO-1', location: 'Split', address: 'Riva 1', postal_code: '21000', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }]],
    ]);

    session(id: string) {
        const user = { id, email: id === aliceId ? 'alice@example.com' : 'bob@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, exp: expiresAt, role: 'authenticated' })).toString('base64url')}.fixture-signature`;
        return { user, access_token: token, refresh_token: `refresh-${id}`, token_type: 'bearer', expires_in: 3600, expires_at: expiresAt };
    }

    async install(context: BrowserContext) {
        await context.routeWebSocket(/\/realtime\/v1\//, () => {});
        await context.route('**/*', async route => {
            const request = route.request();
            const url = new URL(request.url());
            if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
            const json = (value: unknown, status = 200, headers: Record<string, string> = {}) => route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(value) });
            if (!/\/(auth|rest|storage|functions)\/v1\//.test(url.pathname)) return route.abort();
            if (this.offline) return route.abort('internetdisconnected');
            const bearer = request.headers().authorization?.replace(/^Bearer /, '') ?? '';
            let id = aliceId;
            try { id = JSON.parse(Buffer.from(bearer.split('.')[1], 'base64url').toString()).sub ?? aliceId; } catch { /* anonymous login request */ }
            if (url.pathname.startsWith('/auth/v1/')) {
                if (url.pathname.endsWith('/logout')) {
                    this.logoutRequests++;
                    if (this.rejectLogout) return json({ message: 'Logout unavailable', code: 'unexpected_failure' }, 500);
                    return route.fulfill({ status: 204 });
                }
                if (url.pathname.endsWith('/token')) {
                    const body = request.postDataJSON() as { email?: string; refresh_token?: string };
                    id = body.email === 'bob@example.com' || body.refresh_token === `refresh-${bobId}` ? bobId : aliceId;
                }
                const session = this.session(id);
                return json(url.pathname.endsWith('/user') ? session.user : session);
            }
            if (!url.pathname.startsWith('/rest/v1/')) return json([]);
            const table = url.pathname.split('/').at(-1);
            let rows: Row[] = table === 'customers' ? this.rows.get(id) ?? []
                : table === 'constructions' && id === aliceId ? [{ id: constructionId, customer_id: customerId, name: 'Alice construction', work_order: 'AL-C1', location: 'Zagreb', is_active: true, is_archived: false, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }]
                : table === 'profiles' ? [{ ...this.session(id).user, name: id === aliceId ? 'Alice' : 'Bob', last_name: 'Inspector', username: id === aliceId ? 'alice' : 'bob', role: 'admin', title: 'Engineer', gender: 'F', accreditations: [1, 2] }] : [];
            for (const [key, filter] of url.searchParams) {
                if (filter.startsWith('eq.')) rows = rows.filter(row => String(row[key]) === filter.slice(3));
                if (filter.startsWith('neq.')) rows = rows.filter(row => String(row[key]) !== filter.slice(4));
            }
            if (request.method() === 'PATCH' && table === 'constructions' && this.rejectCustomerWrites) return json({ message: 'Fixture maintenance', code: '42501' }, 403);
            if (request.method() === 'PATCH' && table === 'customers') {
                if (this.rejectCustomerWrites) return json({ message: 'Fixture maintenance', code: '42501' }, 403);
                const data = request.postDataJSON() as Row;
                const invalidColumn = Object.keys(data).find(key => !['name', 'work_order', 'location', 'address', 'postal_code', 'oib', 'updated_at'].includes(key));
                if (invalidColumn) return json({ message: `Column ${invalidColumn} does not exist`, code: 'PGRST204' }, 400);
                this.customerWrites.push(data);
                rows.forEach(row => Object.assign(row, data, { updated_at: new Date().toISOString() }));
            }
            if (request.method() === 'POST' && table === 'customers') {
                if (this.rejectCustomerWrites) return json({ message: 'Fixture maintenance', code: '42501' }, 403);
                const payload = request.postDataJSON();
                const row = { ...(Array.isArray(payload) ? payload[0] : payload), id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
                this.customerWrites.push(row);
                this.rows.get(id)?.push(row);
                rows = [row];
            }
            const count = rows.length;
            const columns = url.searchParams.get('select');
            if (columns && !columns.includes('*') && !columns.includes('(')) rows = rows.map(row => Object.fromEntries(columns.split(',').map(column => [column.trim(), row[column.trim()]])));
            const single = request.headers().accept?.includes('vnd.pgrst.object');
            return json(single ? rows[0] ?? null : rows, 200, { 'content-range': `0-${Math.max(0, count - 1)}/${count}` });
        });
    }
}

async function signIn(page: Page, email = 'alice@example.com') {
    await page.goto('/login');
    await page.locator('#identifier').fill(email);
    await page.locator('#password').fill('fixture-password');
    await page.getByRole('button', { name: 'Prijava', exact: true }).click();
    await expect(page).toHaveURL(/\/(?:customers)?$/);
}

async function readStore(page: Page, store: string): Promise<Row[]> {
    return page.evaluate(async storeName => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('ai-generator-offline');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        try {
            return await new Promise<Row[]>((resolve, reject) => {
                const request = db.transaction(storeName).objectStore(storeName).getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } finally { db.close(); }
    }, store);
}

async function setOffline(context: BrowserContext, backend: OfflineBackend, offline: boolean) {
    backend.offline = offline;
    await context.setOffline(offline);
}

async function clickSignOut(page: Page) {
    await page.getByRole('button', { name: 'Odjava', exact: true }).first().click();
}

async function editCustomerOffline(page: Page, context: BrowserContext, backend: OfflineBackend) {
    await page.goto(`/customers/${customerId}`);
    await expect(page.locator('input[name="name"]')).toHaveValue('Alice customer');
    await setOffline(context, backend, true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await expect(page.locator('input[name="name"]')).toHaveValue('Alice customer');
    await page.locator('input[name="name"]').fill('Alice offline edit');
    await expect(page.locator('input[name="postal_code"]')).toHaveValue('10000');
    await page.getByRole('button', { name: 'Spremi', exact: true }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await expect.poll(async () => (await readStore(page, 'sync_queue')).length).toBe(1);
    await expect(page.locator('table').getByText('Alice offline edit', { exact: true })).toBeVisible();
}

test.use({ serviceWorkers: 'block' });

test('offline changes survive cancelled and failed logout, then are cleared before the second account', async ({ context, page }) => {
    const backend = new OfflineBackend();
    await backend.install(context);
    await signIn(page);
    await page.goto('/customers');
    await expect(page.getByRole('cell', { name: 'Alice customer', exact: true })).toBeVisible();
    await editCustomerOffline(page, context, backend);

    await clickSignOut(page);
    const confirmation = page.getByRole('alertdialog');
    await expect(confirmation).toContainText('Imate 1 nesinkroniziranih/lokalnih promjena');
    await confirmation.getByRole('button', { name: 'Odustani', exact: true }).click();
    await expect(confirmation).toBeHidden();
    expect(await readStore(page, 'sync_queue')).toHaveLength(1);
    expect(backend.logoutRequests).toBe(0);
    await expect(page).toHaveURL(/\/customers$/);

    // Keep the queue while reconnecting; the backend rejects sync attempts.
    backend.rejectCustomerWrites = true;
    backend.rejectLogout = true;
    await setOffline(context, backend, false);
    await clickSignOut(page);
    await confirmation.getByRole('button', { name: 'Odjava', exact: true }).click();
    await expect(page.getByText('Odjava nije dovršena. Provjerite vezu i pokušajte ponovno.', { exact: true })).toBeVisible();
    expect(await readStore(page, 'sync_queue')).toHaveLength(1);
    await expect(page).toHaveURL(/\/customers$/);

    backend.rejectLogout = false;
    await clickSignOut(page);
    await confirmation.getByRole('button', { name: 'Odjava', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(async () => (await readStore(page, 'customers')).length).toBe(0);
    expect(await readStore(page, 'sync_queue')).toEqual([]);

    await signIn(page, 'bob@example.com');
    await page.goto('/customers');
    await expect(page.getByRole('cell', { name: 'Bob customer', exact: true })).toBeVisible();
    await expect(page.getByText('Alice offline edit', { exact: true })).toHaveCount(0);
    expect((await readStore(page, 'customers')).every(row => row.id === bobCustomerId)).toBe(true);
});

test('confirmed logout propagates to another open tab and clears shared account data', async ({ context, page }) => {
    const backend = new OfflineBackend();
    await backend.install(context);
    await signIn(page);
    await page.goto('/customers');
    await expect(page.getByRole('cell', { name: 'Alice customer', exact: true })).toBeVisible();
    const otherPage = await context.newPage();
    await otherPage.goto('/customers');
    await expect(otherPage.getByRole('cell', { name: 'Alice customer', exact: true })).toBeVisible();
    await clickSignOut(page);
    await expect(page).toHaveURL(/\/login$/);
    await expect(otherPage).toHaveURL(/\/login$/);
    expect(await readStore(otherPage, 'customers')).toEqual([]);

    await signIn(page, 'bob@example.com');
    await otherPage.goto('/customers');
    await expect(otherPage.getByRole('cell', { name: 'Bob customer', exact: true })).toBeVisible();
    await expect(otherPage.getByText('Alice customer', { exact: true })).toHaveCount(0);
});

test('reopening a queued customer edit after reconnection retains the local values', async ({ context, page }) => {
    const backend = new OfflineBackend();
    await backend.install(context);
    await signIn(page);
    await page.goto('/customers');
    await expect(page.getByRole('cell', { name: 'Alice customer', exact: true })).toBeVisible();
    await editCustomerOffline(page, context, backend);
    backend.rejectCustomerWrites = true;
    await setOffline(context, backend, false);
    for (let attempts = 1; attempts <= 5; attempts++) {
        await expect.poll(async () => Number((await readStore(page, 'sync_queue'))[0]?.retryCount ?? 0)).toBeGreaterThanOrEqual(attempts);
        if (attempts < 5) {
            await page.getByRole('button', { name: '1 promjena na čekanju', exact: true }).click();
        }
    }
    expect((await readStore(page, 'sync_queue'))[0]?.status).toBe('failed');
    await page.goto(`/customers/${customerId}`);
    await expect(page.locator('input[name="name"]')).toHaveValue('Alice offline edit');
    expect(await readStore(page, 'sync_queue')).toHaveLength(1);
    backend.rejectCustomerWrites = false;
    await page.locator('input[name="name"]').fill('Newest online edit');
    await page.getByRole('button', { name: 'Spremi', exact: true }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await expect.poll(() => backend.customerWrites.some(row => row.name === 'Newest online edit')).toBe(true);
    expect(await readStore(page, 'sync_queue')).toEqual([]);
    await page.reload();
    await expect(page.locator('table').getByText('Newest online edit', { exact: true })).toBeVisible();
});

test('a lost connection during save queues the customer while the browser still reports online', async ({ context, page }) => {
    const backend = new OfflineBackend();
    await backend.install(context);
    await signIn(page);
    await page.goto('/customers/new');
    await page.locator('input[name="name"]').fill('Connection interrupted');
    await page.locator('input[name="work_order"]').fill('NET-1');
    await page.locator('input[name="location"]').fill('Zagreb');
    await page.locator('input[name="address"]').fill('Network street 1');
    await page.locator('input[name="postal_code"]').fill('10000');
    backend.offline = true;
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);
    await page.getByRole('button', { name: 'Spremi', exact: true }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await expect.poll(async () => (await readStore(page, 'sync_queue')).length).toBe(1);
    await expect(page.locator('table').getByText('Connection interrupted', { exact: true })).toBeVisible();
    expect(backend.customerWrites).toHaveLength(0);
});

test('reopening a queued construction edit retains local values after reconnection', async ({ context, page }) => {
    const backend = new OfflineBackend();
    await backend.install(context);
    await signIn(page);
    const formUrl = `/customers/${customerId}/constructions/${constructionId}`;
    // This SDK/queue test blocks the worker; load both route chunks before
    // disconnecting. The separate installed-PWA tests cover offline reloads.
    await page.goto(`/customers/${customerId}/constructions`);
    await expect(page.locator('table').getByText('Alice construction', { exact: true })).toBeVisible();
    await page.locator('table').locator(`a[href="${formUrl}"]`).click();
    await expect(page.locator('input[name="name"]')).toHaveValue('Alice construction');
    await setOffline(context, backend, true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await page.locator('input[name="name"]').fill('Offline construction edit');
    await page.getByRole('button', { name: 'Spremi', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/customers/${customerId}/constructions$`));
    await expect.poll(async () => (await readStore(page, 'sync_queue')).length).toBe(1);
    backend.rejectCustomerWrites = true;
    await setOffline(context, backend, false);
    await page.goto(formUrl);
    await expect(page.locator('input[name="name"]')).toHaveValue('Offline construction edit');
});

test.describe('installed PWA', () => {
    test.use({ serviceWorkers: 'allow' });
    test('low bandwidth customer lists retain the fields needed to edit offline', async ({ context, page }) => {
        const backend = new OfflineBackend();
        await backend.install(context);
        await context.addInitScript(() => localStorage.setItem('lowBandwidthMode', 'true'));
        await signIn(page);
        test.skip(await page.locator('script[src*="/@vite/client"]').count() > 0, 'The development server does not install the production service worker.');
        await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
        await page.goto('/customers');
        await expect(page.getByRole('cell', { name: 'Alice customer', exact: true })).toBeVisible();
        await setOffline(context, backend, true);
        await page.goto(`/customers/${customerId}`);
        await expect(page.locator('input[name="postal_code"]')).toHaveValue('10000');
        await page.locator('input[name="name"]').fill('Edited from a cached list');
        await page.getByRole('button', { name: 'Spremi', exact: true }).click();
        await expect(page).toHaveURL(/\/customers$/);
        await expect.poll(async () => (await readStore(page, 'sync_queue')).length).toBe(1);
        await page.goto('/examiners');
        await expect(page).toHaveURL(/\/examiners$/);
        await expect(page.locator('main').getByRole('heading', { name: 'Ispitivači', exact: true })).toBeVisible();
        await page.goto('/profile');
        await expect(page.locator('#name')).toHaveValue('Alice');
        await expect(page.locator('#title')).toHaveValue('Engineer');
        await expect(page.locator('#gender-f')).toBeChecked();
    });

    test('offline customer creation survives reload and syncs exactly once on reconnection', async ({ context, page }) => {
        const backend = new OfflineBackend();
        await backend.install(context);
        await signIn(page);
        test.skip(await page.locator('script[src*="/@vite/client"]').count() > 0, 'The development server does not install the production service worker.');
        await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
        await page.goto('/customers');
        await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
        await expect(page.getByRole('cell', { name: 'Alice customer', exact: true })).toBeVisible();

        await setOffline(context, backend, true);
        await page.reload();
        await expect(page.getByRole('cell', { name: 'Alice customer', exact: true })).toBeVisible();
        await page.locator('a[href="/customers/new"]').click();
        await page.locator('input[name="name"]').fill('Created in the field');
        await page.locator('input[name="work_order"]').fill('FIELD-1');
        await page.locator('input[name="location"]').fill('Zagreb');
        await page.locator('input[name="address"]').fill('Offline street 1');
        await page.locator('input[name="postal_code"]').fill('10000');
        await page.getByRole('button', { name: 'Spremi', exact: true }).click();
        await expect(page).toHaveURL(/\/customers$/);
        await expect(page.locator('table').getByText('Created in the field', { exact: true })).toBeVisible();
        await page.reload();
        await expect(page.locator('table').getByText('Created in the field', { exact: true })).toBeVisible();
        expect(await readStore(page, 'sync_queue')).toHaveLength(1);
        expect(backend.customerWrites).toHaveLength(0);

        await setOffline(context, backend, false);
        await expect.poll(() => backend.customerWrites.length, { timeout: 20_000 }).toBe(1);
        await expect.poll(async () => (await readStore(page, 'sync_queue')).length).toBe(0);
        await page.reload();
        await expect(page.locator('table').getByText('Created in the field', { exact: true })).toBeVisible();
        expect((await readStore(page, 'customers')).filter(row => row.name === 'Created in the field')).toHaveLength(1);
        expect(backend.customerWrites).toHaveLength(1);
    });
});
