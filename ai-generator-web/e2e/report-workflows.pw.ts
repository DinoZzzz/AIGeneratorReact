import { expect, test, type Page } from '@playwright/test';
import { installReportFixtures, loginReportFixture, reportBase, userId } from './helpers/report-fixtures';

const input = (page: Page, name: string) => page.locator(`[name="${name}"]`);
const nextStep = (page: Page) => page.getByRole('button', { name: 'Sljedeći korak', exact: true }).click();
const save = (page: Page) => page.getByRole('button', { name: 'Spremi obrazac', exact: true }).click();
const resultRow = (page: Page, label: string) => page.locator('main').getByText(label, { exact: true }).locator('..');

test('air report: calculate, save, reload, edit and duplicate using real controls', async ({ context, page }) => {
    const fixture = await installReportFixtures(context);
    await loginReportFixture(page);
    await page.goto(`${reportBase}/new/air`);
    await input(page, 'draft_id').selectOption('2');
    await input(page, 'examination_procedure_id').selectOption('14');
    await input(page, 'pipe_material_id').selectOption('12');
    await input(page, 'dionica').fill('AIR-001');
    await input(page, 'temperature').fill('0');
    await input(page, 'pipe_diameter').fill('200');
    await input(page, 'pipe_length').fill('25');
    await nextStep(page);
    await input(page, 'pressure_start').fill('200');
    await input(page, 'pressure_end').fill('190');
    await expect(resultRow(page, 'Gubitak tlaka')).toContainText('10.00 mbar');
    await expect(resultRow(page, 'Dopušteni gubitak')).toContainText('15.00 mbar');
    await expect(resultRow(page, 'Vrijeme ispitivanja')).toContainText('00:01:30');
    await expect(page.getByText('ZADOVOLJAVA', { exact: true }).first()).toBeVisible();
    await save(page);
    await expect(page).toHaveURL(reportBase);
    expect(fixture.tables.report_forms).toHaveLength(1);
    const saved = fixture.tables.report_forms[0];
    expect(saved).toMatchObject({ dionica: 'AIR-001', temperature: 0, pressure_loss: 10, allowed_loss: 15, required_test_time: 1.5, examination_duration: '00:01:30', satisfies: true, user_id: userId });

    await page.goto(`${reportBase}/air/${saved.id}`);
    await expect(input(page, 'temperature')).toHaveValue('0');
    await expect(input(page, 'examination_procedure_id')).toHaveValue('14');
    await input(page, 'pipe_diameter').fill('400');
    await nextStep(page);
    await expect(resultRow(page, 'Vrijeme ispitivanja')).toContainText('00:02:30');
    await input(page, 'pressure_end').fill('180');
    await expect(page.getByText('NE ZADOVOLJAVA', { exact: true }).first()).toBeVisible();
    await save(page);
    await expect(page).toHaveURL(reportBase);
    expect(saved).toMatchObject({ pipe_diameter: 400, pressure_loss: 20, satisfies: false, required_test_time: 2.5 });

    await page.locator('button[title="Dupliciraj"]:visible').first().click();
    await expect(page).toHaveURL(`${reportBase}/new/air?duplicate=${saved.id}`);
    await expect(input(page, 'dionica')).toHaveValue('AIR-001');
    await expect(input(page, 'pipe_diameter')).toHaveValue('400');
    await input(page, 'dionica').fill('AIR-002');
    await nextStep(page);
    await input(page, 'pressure_end').fill('198');
    await save(page);
    await expect(page).toHaveURL(reportBase);
    expect(fixture.tables.report_forms).toHaveLength(2);
    expect(fixture.tables.report_forms[1]).toMatchObject({ dionica: 'AIR-002', satisfies: true, pressure_loss: 2, user_id: userId });
    expect(fixture.tables.report_forms[1].id).not.toBe(saved.id);
    expect(fixture.rejectedColumns).toEqual([]);
    expect(fixture.pageErrors).toEqual([]);
});

test('water report: shaft geometry, measured boundary, save-and-new and reload', async ({ context, page }) => {
    const fixture = await installReportFixtures(context);
    await loginReportFixture(page);
    await page.goto(`${reportBase}/new/water`);
    await input(page, 'dionica').fill('WATER-001');
    await input(page, 'pane_diameter').fill('1000');
    await input(page, 'water_height').fill('100');
    await input(page, 'temperature').fill('15');
    await nextStep(page);
    await input(page, 'water_height_start').fill('100');
    await input(page, 'water_height_end').fill('99');
    await expect(resultRow(page, 'Gubitak vode')).toContainText('1.00 mm');
    await expect(resultRow(page, 'Ukupna omočena površina')).toContainText('3.93');
    await expect(resultRow(page, 'Rezultat')).toContainText('0.20 l/m²');
    await expect(page.getByText('ZADOVOLJAVA', { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Spremi i novi', exact: true }).click();
    await expect(input(page, 'pane_diameter')).toHaveValue('1000');
    await expect(input(page, 'water_height')).toHaveValue('100');
    expect(fixture.tables.report_forms).toHaveLength(1);
    const first = fixture.tables.report_forms[0];
    await input(page, 'dionica').fill('WATER-002');
    await nextStep(page);
    await expect(input(page, 'water_height_start')).toHaveValue('');
    await expect(input(page, 'water_height_end')).toHaveValue('');
    await input(page, 'water_height_start').fill('100');
    await input(page, 'water_height_end').fill('97');
    await expect(page.getByText('NE ZADOVOLJAVA', { exact: true }).first()).toBeVisible();
    await save(page);
    await expect(page).toHaveURL(reportBase);
    expect(fixture.tables.report_forms).toHaveLength(2);
    expect(first).toMatchObject({ dionica: 'WATER-001', satisfies: true });
    expect(fixture.tables.report_forms[1]).toMatchObject({ dionica: 'WATER-002', satisfies: false });
    await page.goto(`${reportBase}/${first.id}`);
    await expect(input(page, 'pane_diameter')).toHaveValue('1000');
    await nextStep(page);
    await expect(input(page, 'water_height_end')).toHaveValue('99');
    await input(page, 'water_height_end').fill('97.99');
    await expect(resultRow(page, 'Rezultat')).toContainText('0.40 l/m²');
    await expect(page.getByText('NE ZADOVOLJAVA', { exact: true }).first()).toBeVisible();
    await save(page);
    await expect(page).toHaveURL(reportBase);
    expect(first.satisfies).toBe(false);
    expect(fixture.rejectedColumns).toEqual([]);
    expect(fixture.pageErrors).toEqual([]);
});

for (const method of ['water', 'air'] as const) {
    test(`${method} save-and-new from global reports keeps a valid route`, async ({ context, page }) => {
        const fixture = await installReportFixtures(context);
        await loginReportFixture(page);
        const path = method === 'air' ? '/reports/new/air' : '/reports/new';
        await page.goto(path);
        await expect(page.getByRole('heading', { name: method === 'air' ? 'Novi zapis zraka' : 'Novi zapis vode', exact: true })).toBeVisible();
        await input(page, 'dionica').fill('GLOBAL-001');
        await input(page, 'pane_diameter').fill('1000');
        if (method === 'water') await input(page, 'water_height').fill('100');
        await nextStep(page);
        await input(page, method === 'air' ? 'pressure_start' : 'water_height_start').fill('100');
        await input(page, method === 'air' ? 'pressure_end' : 'water_height_end').fill('99');
        await page.getByRole('button', { name: 'Spremi i novi', exact: true }).click();
        await expect.poll(() => fixture.tables.report_forms.length).toBe(1);
        await expect(input(page, 'dionica')).toBeVisible();
        await expect(page).toHaveURL(path);
        expect(fixture.tables.report_forms).toHaveLength(1);
        expect(fixture.pageErrors).toEqual([]);
    });
}

test('water mobile: rectangular shaft and pipe calculate, drawer opens, save persists', async ({ context, page }) => {
    const fixture = await installReportFixtures(context);
    await page.setViewportSize({ width: 390, height: 844 });
    await loginReportFixture(page);
    await page.goto(`${reportBase}/new/water`);
    await input(page, 'dionica').fill('MOBILE-001');
    await input(page, 'draft_id').selectOption('3');
    await input(page, 'material_type_id').selectOption('2');
    await input(page, 'pane_width').fill('100');
    await input(page, 'pane_length').fill('200');
    await input(page, 'pane_height').fill('150');
    await input(page, 'water_height').fill('100');
    await input(page, 'pipe_diameter').fill('200');
    await input(page, 'pipe_length').fill('10');
    await input(page, 'pipe_material_id').selectOption('12');
    await nextStep(page);
    await input(page, 'water_height_start').fill('100');
    await input(page, 'water_height_end').fill('99');
    await page.getByRole('button', { name: /Detalji/ }).click();
    const drawer = page.locator('[role="presentation"]');
    // 8 m² shaft + π × 0.2 × 10 m² pipe + 0.03 m² closed pipe end.
    await expect(drawer.getByText('Ukupna omočena površina', { exact: true }).locator('..')).toContainText('14.31');
    await expect(drawer.getByText('Gubitak volumena', { exact: true }).locator('..')).toContainText('2.0000 l');
    await expect(drawer.getByText('ZADOVOLJAVA', { exact: true })).toBeVisible();
    await drawer.getByRole('button', { name: 'Zatvori', exact: true }).click();
    await save(page);
    await expect(page).toHaveURL(reportBase);
    expect(fixture.tables.report_forms[0]).toMatchObject({ dionica: 'MOBILE-001', draft_id: 3, material_type_id: 2, pane_width: 100, pane_length: 200, pipe_length: 10, pipe_material_id: 12, satisfies: true });
    expect(fixture.pageErrors).toEqual([]);
});

function seedExportReports(fixture: Awaited<ReturnType<typeof installReportFixtures>>) {
    const shared = {
        customer_id: fixture.tables.customers[0].id, construction_id: fixture.tables.constructions[0].id,
        user_id: userId, created_at: '2026-10-13T09:00:00Z', updated_at: '2026-10-13T09:00:00Z',
        examination_date: '2026-10-13', temperature: 15, pane_material_id: 1, pipe_material_id: 11,
        material_type_id: 1, pipe_length: 25, pipe_diameter: 200, pipeline_slope: 0,
        pane_diameter: 1000, pane_width: 0, pane_length: 0, pane_height: 100,
        water_height: 100, water_height_start: 100, water_height_end: 99,
        pressure_start: 200, pressure_end: 190, ro_height: 0, depositional_height: 0,
        saturation_of_test_section: 0, saturation_time: '01:00:00', examination_duration: '00:01:30',
        examination_start_time: '09:00', examination_end_time: '09:02', stabilization_time: '5',
        satisfies: true, remark: '', deviation: '',
    };
    const air = { ...shared, id: '66666666-6666-4666-8666-666666666666', ordinal: 1, type_id: 2, draft_id: 2, dionica: 'AIR-EXPORT', examination_procedure_id: 14, allowed_loss: 15, pressure_loss: 10, required_test_time: 1.5 };
    const water = { ...shared, id: '77777777-7777-4777-8777-777777777777', ordinal: 2, type_id: 1, draft_id: 1, dionica: 'WATER-EXPORT', pipe_length: 0, examination_duration: '00:30:00' };
    fixture.tables.report_forms.push(air, water);
    return { air, water };
}

async function pdfText(path: string) {
    const { readFile } = await import('node:fs/promises');
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdf = await getDocument({ data: new Uint8Array(await readFile(path)), useSystemFonts: true }).promise;
    const text = [];
    for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number);
        const content = await page.getTextContent();
        text.push(content.items.map(item => 'str' in item ? item.str : '').join(' '));
    }
    await pdf.destroy();
    return text;
}

test('PDF preview and saved bulk export contain current method, material and both sections', async ({ context, page }, testInfo) => {
    const fixture = await installReportFixtures(context);
    const { air } = seedExportReports(fixture);
    await loginReportFixture(page);
    await page.goto(`${reportBase}/air/${air.id}`);
    await expect(input(page, 'examination_procedure_id')).toHaveValue('14');
    await input(page, 'pipe_material_id').selectOption('12');
    await nextStep(page);
    const previewDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Izvoz PDF', exact: true }).click();
    const preview = await previewDownload;
    const previewPath = testInfo.outputPath('air-preview.pdf');
    await preview.saveAs(previewPath);
    const previewPages = await pdfText(previewPath);
    expect(previewPages).toHaveLength(1);
    expect(previewPages[0]).toContain('AIR-EXPORT');
    expect(previewPages[0]).toMatch(/\bLD\b/);
    expect(previewPages[0]).toContain('PVC');
    expect(previewPages[0]).toContain('QA-2026-001');
    await save(page);
    await expect(page).toHaveURL(reportBase);
    await page.getByRole('button', { name: 'Izvezi sve', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const bulkDownload = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Izvezi', exact: true }).click();
    const bulk = await bulkDownload;
    const bulkPath = testInfo.outputPath('reports-bulk.pdf');
    await bulk.saveAs(bulkPath);
    const bulkPages = await pdfText(bulkPath);
    expect(bulkPages).toHaveLength(2);
    const airPage = bulkPages.find(text => text.includes('AIR-EXPORT'));
    expect(airPage).toMatch(/\bLD\b/);
    expect(airPage).toContain('PVC');
    expect(bulkPages.some(text => text.includes('WATER-EXPORT'))).toBe(true);
    expect(fixture.pageErrors).toEqual([]);
});

for (const includePdfs of [false, true]) {
    test(`Word export with PDF attachments ${includePdfs ? 'enabled' : 'disabled'} populates document and associates every selected report in history`, async ({ context, page }, testInfo) => {
        const fixture = await installReportFixtures(context);
        const { air, water } = seedExportReports(fixture);
        await loginReportFixture(page);
        await page.goto(reportBase);
        await page.getByRole('button', { name: 'Generiraj izvještaj', exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await dialog.getByPlaceholder('npr. Zgrada 1').fill('QA drainage section');
        await dialog.getByPlaceholder('Tip sustava...').fill('Otpadne vode');
        if (includePdfs) await dialog.locator('#includePdfs').check();
        const wordDownload = page.waitForEvent('download');
        await dialog.getByRole('button', { name: 'Izvezi', exact: true }).click();
        const download = await wordDownload;
        expect(download.suggestedFilename()).toMatch(/^QA-2026-001.*\.docx$/);
        const path = testInfo.outputPath('reports.docx');
        await download.saveAs(path);
        const { readFile } = await import('node:fs/promises');
        const { default: PizZip } = await import('pizzip');
        const zip = new PizZip(await readFile(path));
        const xml = zip.file(/^word\/(document|header\d*|footer\d*)\.xml$/).map(file => file.asText()).join('');
        for (const expected of ['AIR-EXPORT', 'WATER-EXPORT', 'LD - 200,00', 'Browser Test Customer', 'Browser Test Construction', 'QA-2026-001', 'QA drainage section']) {
            expect(xml.includes(expected), `Generated Word document contains ${expected}`).toBe(true);
        }
        if (includePdfs) {
            expect(zip.file(/^word\/media\/[^/]+$/)).toHaveLength(fixture.templateMediaCount + 2);
            const renderedPages = zip.file(/^word\/media\/image_generated_\d+\.png$/);
            expect(renderedPages).toHaveLength(2);
            for (const image of renderedPages) {
                const data = image.asUint8Array();
                expect(Array.from(data.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
                expect(data.length).toBeGreaterThan(10000);
            }
        }
        await expect.poll(() => fixture.tables.report_exports.length).toBe(1);
        await expect.poll(() => fixture.tables.report_export_forms.length).toBe(2);
        expect(fixture.tables.report_export_forms.map(row => row.form_id).sort()).toEqual([air.id, water.id].sort());
        expect(fixture.tables.report_export_forms.every(row => row.export_id === fixture.tables.report_exports[0].id)).toBe(true);
        expect(fixture.pageErrors).toEqual([]);
    });
}
