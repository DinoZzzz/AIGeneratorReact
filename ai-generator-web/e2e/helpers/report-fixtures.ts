import { expect, type BrowserContext, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import PizZip from 'pizzip';

export type FixtureRow = Record<string, unknown>;
export const customerId = '22222222-2222-4222-8222-222222222222';
export const constructionId = '33333333-3333-4333-8333-333333333333';
export const userId = '11111111-1111-4111-8111-111111111111';
export const reportBase = `/customers/${customerId}/constructions/${constructionId}/reports`;
const now = '2026-10-13T09:00:00.000Z';
const reportColumns = new Set(`id ordinal user_id type_id draft_id dionica section_name stock examination_procedure_id customer_id construction_id temperature pane_material_id material_type_id pipe_material_id pipe_length pipe_diameter pipeline_slope pane_width pane_height pane_length saturation_of_test_section water_height water_height_start water_height_end pressure_start pressure_end ro_height pane_diameter allowed_loss pressure_loss required_test_time depositional_height stabilization_time saturation_time examination_date examination_duration examination_start_time examination_end_time satisfies remark deviation created_at updated_at`.split(' '));

export async function installReportFixtures(context: BrowserContext) {
    const user = { id: userId, email: 'inspector@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: now };
    const profile = { id: userId, email: user.email, name: 'Test', last_name: 'Inspector', username: 'inspector', role: 'admin', accreditations: [1, 2], created_at: now, updated_at: now };
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt, role: 'authenticated' })).toString('base64url')}.test-signature`;
    const session = { user, access_token: accessToken, refresh_token: 'test-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: expiresAt };
    const tables: Record<string, FixtureRow[]> = {
        profiles: [profile],
        customers: [{ id: customerId, name: 'Browser Test Customer', address: 'Testna 1', location: 'Zagreb', postal_code: '10000', oib: '12345678901', created_at: now, updated_at: now }],
        constructions: [{ id: constructionId, customer_id: customerId, name: 'Browser Test Construction', location: 'Zagreb', work_order: 'QA-2026-001', is_active: true, is_archived: false, created_at: now, updated_at: now }],
        report_types: [{ id: 1, name: 'Voda' }, { id: 2, name: 'Zrak' }],
        report_drafts: [{ id: 1, name: 'Okno' }, { id: 2, name: 'Cjevovod' }, { id: 3, name: 'Okno i cjevovod' }, { id: 4, name: 'Slivnik' }, { id: 5, name: 'Slivnik i cjevovod' }],
        material_types: [{ id: 1, name: 'Okruglo' }, { id: 2, name: 'Pravokutno' }],
        materials: [{ id: 1, material_type_id: 1, name: 'Beton' }, { id: 2, material_type_id: 1, name: 'Plastika' }, { id: 11, material_type_id: 2, name: 'Beton' }, { id: 12, material_type_id: 2, name: 'PVC' }],
        // Deliberately not legacy 1..4: form/PDF must use selected procedure names.
        examination_procedures: [{ id: 11, name: 'LA', allowed_loss: 2.5, pressure: 10 }, { id: 12, name: 'LB', allowed_loss: 10, pressure: 50 }, { id: 13, name: 'LC', allowed_loss: 15, pressure: 100 }, { id: 14, name: 'LD', allowed_loss: 15, pressure: 200 }],
        certifiers: [{ id: '55555555-5555-4555-8555-555555555555', name: 'Test', last_name: 'Certifier', title: 'ing.', is_default: true, is_active: true, created_at: now, updated_at: now }],
        report_forms: [], report_exports: [], report_export_forms: [], report_files: [], scheme_images: [], template_metadata: [], user_sessions: [],
    };
    const writes: { table: string; method: string; data: FixtureRow }[] = [];
    const rejectedColumns: string[] = [];
    const pageErrors: string[] = [];
    let nextId = 100;
    // Production templates are uploaded by admins. Extend the bundled legacy
    // document with the supported row loops so this fixture verifies report
    // data, not just that a mostly static document can be downloaded.
    // Optional local copy of an actual uploaded template allows a read-only
    // integration check without committing customer files or fetching in CI.
    const uploadedTemplatePath = process.env.E2E_REPORT_TEMPLATE_PATH;
    const template = new PizZip(await readFile(uploadedTemplatePath || new URL('../../public/templates/method1610.docx', import.meta.url)));
    if (!uploadedTemplatePath) {
        const templateXml = template.file('word/document.xml')!.asText();
        const row = (fields: string[]) => `<w:tr>${fields.map(field => `<w:tc><w:p><w:r><w:t>${field}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;
        const reportTables = `<w:tbl>${row(['{#airTests}{stock}', '{procedureInfo}', '{pipeLength}', '{pressureLoss}{/airTests}'])}</w:tbl>` +
            `<w:tbl>${row(['{#waterTests}{stock}', '{waterVolumeLoss}', '{result}{/waterTests}'])}</w:tbl>`;
        template.file('word/document.xml', templateXml.replace('<w:sectPr>', `${reportTables}<w:sectPr>`));
    }
    const templateBytes = template.generate({ type: 'nodebuffer' });
    const templateMediaCount = template.file(/^word\/media\/[^/]+$/).length;
    const newId = () => `44444444-4444-4444-8444-${String(nextId++).padStart(12, '0')}`;
    const filterRows = (rows: FixtureRow[], url: URL) => rows.filter(row => [...url.searchParams].every(([column, value]) => {
        if (value.startsWith('eq.')) return String(row[column]) === value.slice(3);
        if (value.startsWith('in.(')) return value.slice(4, -1).split(',').includes(String(row[column]));
        if (value.startsWith('is.')) return value === 'is.null' ? row[column] == null : String(row[column]) === value.slice(3);
        return true;
    }));
    await context.routeWebSocket(/\/realtime\/v1\//, () => {});
    await context.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        const json = (data: unknown, status = 200, headers = {}) => route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(data) });
        if (url.pathname.startsWith('/auth/v1/')) return json(url.pathname.endsWith('/user') ? user : session);
        if (url.pathname.startsWith('/rest/v1/')) {
            if (url.pathname.includes('/rpc/')) return json([]);
            const table = url.pathname.split('/').at(-1)!;
            const rows = tables[table] ?? (tables[table] = []);
            const method = request.method();
            const single = request.headers().accept?.includes('vnd.pgrst.object');
            let selected = filterRows(rows, url);
            if (method === 'POST' || method === 'PATCH') {
                const body: FixtureRow | FixtureRow[] = request.postDataJSON();
                const payloads = Array.isArray(body) ? body : [body];
                if (table === 'report_forms') {
                    const invalid = payloads.flatMap(row => Object.keys(row).filter(key => !reportColumns.has(key)));
                    if (invalid.length) {
                        rejectedColumns.push(...invalid);
                        return json({ code: 'PGRST204', message: `Could not find the '${invalid[0]}' column of 'report_forms' in the schema cache` }, 400);
                    }
                }
                if (method === 'POST') {
                    selected = payloads.map(payload => {
                        writes.push({ table, method, data: { ...payload } });
                        const id = payload.id ?? newId();
                        const existing = rows.find(row => row.id === id);
                        if (existing) return Object.assign(existing, payload, { updated_at: now });
                        const created = { created_at: now, updated_at: now, ordinal: rows.length, ...payload, id };
                        rows.push(created);
                        return created;
                    });
                } else {
                    for (const row of selected) {
                        writes.push({ table, method, data: { ...payloads[0] } });
                        Object.assign(row, payloads[0], { updated_at: now });
                    }
                }
            } else if (method === 'DELETE') {
                tables[table] = rows.filter(row => !selected.includes(row));
                return json(null);
            }
            if (table === 'report_forms' && url.searchParams.get('select')?.includes('construction:')) {
                selected = selected.map(row => ({ ...row, construction: tables.constructions.find(c => c.id === row.construction_id), draft: tables.report_drafts.find(d => d.id === row.draft_id) }));
            }
            if (table === 'constructions' && url.searchParams.get('select')?.includes('customer')) {
                selected = selected.map(row => ({ ...row, customer: tables.customers.find(c => c.id === row.customer_id) }));
            }
            return json(single ? selected[0] ?? null : selected, 200, { 'content-range': `0-${Math.max(0, selected.length - 1)}/${selected.length}` });
        }
        if (url.pathname.startsWith('/storage/v1/')) {
            if (url.pathname.includes('/templates/') && request.method() === 'GET') {
                return route.fulfill({ contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', body: templateBytes });
            }
            if (request.method() === 'POST' && url.pathname.includes('/list/')) return json([]);
            if (request.method() !== 'GET') return json({ Key: 'fixture-export' });
            return json({ message: 'Fixture asset not found' }, 404);
        }
        // No outbound services may be reached from a stateful browser fixture.
        if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') return route.abort();
        return route.continue();
    });
    const watchPage = (page: Page) => page.on('pageerror', error => pageErrors.push(error.message));
    context.pages().forEach(watchPage);
    context.on('page', watchPage);
    return { tables, writes, rejectedColumns, pageErrors, templateMediaCount };
}

export async function loginReportFixture(page: Page) {
    await page.goto('/login');
    await page.locator('#identifier').fill('inspector@example.com');
    await page.locator('#password').fill('test-password-123');
    await page.getByRole('button', { name: 'Prijava', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
}
