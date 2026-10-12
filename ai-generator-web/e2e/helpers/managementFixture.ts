import { expect, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

type Row = Record<string, unknown> & { id: string | number };
export async function installManagementFixture(context: BrowserContext, role: 'admin' | 'user' = 'admin') {
    const userId = 'b1111111-1111-4111-8111-111111111111';
    const otherId = 'c2222222-2222-4222-8222-222222222222';
    const user = { id: userId, email: 'management@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const token = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt, role: 'authenticated' })).toString('base64url')}.fixture-signature`;
    const session = { user, access_token: token, refresh_token: 'fixture-refresh', token_type: 'bearer', expires_in: 3600, expires_at: expiresAt };
    const tables: Record<string, Row[]> = {
        profiles: [
            { id: userId, email: user.email, username: 'management', name: 'Maja', last_name: 'Ispitivač', role, title: 'dipl.ing.', gender: 'F', accreditations: [1], avatar_url: '' },
            { id: otherId, email: 'other@example.test', username: 'other', name: 'Drugi', last_name: 'Ispitivač', role: 'user', accreditations: [2] },
        ],
        report_types: [{ id: 1, name: 'Voda' }, { id: 2, name: 'Zrak' }],
        customers: [], constructions: [], calendar_events: [],
    };
    const writes: Array<{ table: string; method: string; body: unknown }> = [];
    const rejectedWrites: string[] = [];
    let profileDelay = 0;
    let calendarFailure: 'POST' | 'PATCH' | 'DELETE' | undefined;
    const fulfill = (route: Parameters<Parameters<BrowserContext['route']>[1]>[0], body: unknown, status = 200, count = 0) => route.fulfill({ status, contentType: 'application/json', headers: { 'content-range': `0-${Math.max(count - 1, 0)}/${count}` }, body: JSON.stringify(body) });
    await context.route('**/auth/v1/**', route => fulfill(route, route.request().url().includes('/user') ? user : session));
    await context.route('**/functions/v1/**', route => fulfill(route, { code: 'fixture_function_unavailable' }, 503));
    await context.route('**/storage/v1/**', route => fulfill(route, []));
    await context.routeWebSocket(/\/realtime\/v1\//, () => {});
    await context.route('**/rest/v1/**', async route => {
        const request = route.request();
        const url = new URL(request.url());
        const originalTable = url.pathname.split('/').at(-1)!;
        const table = originalTable === 'customer_activity' ? 'customers' : originalTable;
        const method = request.method();
        const single = request.headers().accept?.includes('vnd.pgrst.object');
        const rows = tables[table] ?? (tables[table] = []);
        const matches = (row: Row) => [...url.searchParams].every(([key, value]) => {
            if (['select', 'order', 'limit', 'offset', 'on_conflict', 'or'].includes(key)) return true;
            const dot = value.indexOf('.');
            const op = value.slice(0, dot); const filter = value.slice(dot + 1);
            const actual = row[key];
            if (op === 'eq') return String(actual) === filter;
            if (op === 'neq') return String(actual) !== filter;
            if (op === 'is') return filter === 'null' ? actual == null : String(actual) === filter;
            if (op === 'in') return filter.slice(1, -1).split(',').includes(String(actual));
            if (op === 'ilike') return String(actual).toLowerCase() === filter.toLowerCase();
            if (op === 'gte') return String(actual) >= filter;
            if (op === 'lte') return String(actual) <= filter;
            if (op === 'gt') return String(actual) > filter;
            if (op === 'lt') return String(actual) < filter;
            return true;
        });
        let result = rows.filter(matches);
        if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
            const body = method === 'DELETE' ? null : request.postDataJSON();
            if (table === 'calendar_events' && method === calendarFailure) return fulfill(route, { code: '42501', message: 'Calendar write denied by fixture policy' }, 403);
            // Emulate PostgREST rejecting joined/computed fields and invalid UUIDs.
            if (table === 'calendar_events' && body) {
                const allowed = ['id', 'title', 'description', 'start', 'end', 'location', 'customer_id', 'construction_id', 'created_by', 'created_at', 'updated_at', 'examiner_ids', 'reminder_enabled', 'reminder_times'];
                const invalid = Object.keys(body).find(key => !allowed.includes(key));
                if (invalid || body.customer_id === '' || body.construction_id === '') {
                    const message = invalid ? `Unknown calendar column: ${invalid}` : 'Invalid empty UUID';
                    rejectedWrites.push(message);
                    return fulfill(route, { code: invalid ? 'PGRST204' : '22P02', message }, 400);
                }
            }
            writes.push({ table, method, body });
            if (method === 'POST') {
                result = (Array.isArray(body) ? body : [body]).map(item => {
                    const row = { id: table === 'materials' ? rows.length + 1 : randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...(table === 'constructions' ? { is_active: true, is_archived: false } : {}), ...item } as Row;
                    const old = rows.find(existing => existing.id === row.id);
                    if (old) Object.assign(old, item); else rows.push(row);
                    return old ?? row;
                });
            } else if (method === 'PATCH') result.forEach(row => Object.assign(row, body));
            else tables[table] = rows.filter(row => !matches(row));
        } else if (table === 'profiles' && profileDelay && url.searchParams.get('id') === `eq.${userId}`) {
            await new Promise(resolve => setTimeout(resolve, profileDelay));
        }
        if (table === 'calendar_events' && (method === 'GET' || method === 'HEAD')) result = result.map(row => ({ ...row, customer: tables.customers.find(customer => customer.id === row.customer_id) ?? null, construction: tables.constructions.find(construction => construction.id === row.construction_id) ?? null }));
        const count = result.length;
        const select = url.searchParams.get('select');
        if (select && !select.includes('*') && !select.includes('(')) result = result.map(row => Object.fromEntries(select.split(',').map(key => [key, row[key]])) as Row);
        if (method === 'HEAD') return route.fulfill({ status: 200, headers: { 'content-range': `*/${count}` } });
        return fulfill(route, single ? result[0] ?? null : result, 200, count);
    });
    return { userId, otherId, tables, writes, rejectedWrites, setProfileDelay: (ms: number) => { profileDelay = ms; }, setCalendarFailure: (method?: 'POST' | 'PATCH' | 'DELETE') => { calendarFailure = method; } };
}

export async function loginManagement(page: Page) {
    await page.goto('/login');
    await page.locator('#identifier').fill('management@example.test');
    await page.locator('#password').fill('fixture-password-123');
    await page.getByRole('button', { name: 'Prijava', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
}
