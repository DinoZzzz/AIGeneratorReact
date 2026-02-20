import { describe, it, expect, vi } from 'vitest';
import type { ReportFormWithJoins } from './types';
import { buildAirReportRows, buildWaterReportRows } from './tableBuilder';

vi.mock('../../lib/supabase', () => ({
    supabase: {}
}));

const makeReport = (overrides: Partial<ReportFormWithJoins>): ReportFormWithJoins => ({
    id: 'report-id',
    ordinal: 1,
    user_id: 'user-id',
    type_id: 1,
    draft_id: 1,
    temperature: 0,
    pipe_length: 0,
    pipe_diameter: 0,
    pipeline_slope: 0,
    pane_width: 0,
    pane_height: 0,
    pane_length: 0,
    saturation_of_test_section: 0,
    water_height: 0,
    water_height_start: 0,
    water_height_end: 0,
    pressure_start: 0,
    pressure_end: 0,
    ro_height: 0,
    pane_diameter: 0,
    depositional_height: 0,
    examination_date: '2026-02-20',
    satisfies: true,
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-02-20T00:00:00Z',
    ...overrides
});

describe('wordExport tableBuilder', () => {
    it('includes air section rows based on section_name + material_type_id', () => {
        const section = makeReport({
            id: 'section-air',
            type_id: 0,
            material_type_id: 2,
            section_name: 'AIR SEKCIJA',
            ordinal: 1
        });
        const report = makeReport({
            id: 'air-report',
            type_id: 2,
            material_type_id: 2,
            draft_id: 2,
            dionica: 'A-1',
            pipe_length: 12.5,
            pressure_start: 50,
            pressure_end: 47.5,
            ordinal: 2
        });

        const rows = buildAirReportRows([report, section]);

        expect(rows).toHaveLength(2);
        expect(rows[0].isSection).toBe(true);
        expect(rows[0].sectionName).toBe('AIR SEKCIJA');
        expect(rows[1].isReport).toBe(true);
        expect(rows[1].ordinal).toBe('1.');
    });

    it('includes water section rows based on section_name + material_type_id', () => {
        const section = makeReport({
            id: 'section-water',
            type_id: 0,
            material_type_id: 1,
            section_name: 'WATER SEKCIJA',
            ordinal: 1
        });
        const report = makeReport({
            id: 'water-report',
            type_id: 1,
            material_type_id: 1,
            draft_id: 1,
            dionica: 'W-1',
            water_height_start: 100,
            water_height_end: 98,
            pane_diameter: 600,
            water_height: 100,
            ordinal: 2
        });

        const rows = buildWaterReportRows([report, section]);

        expect(rows).toHaveLength(2);
        expect(rows[0].isSection).toBe(true);
        expect(rows[0].sectionName).toBe('WATER SEKCIJA');
        expect(rows[1].isReport).toBe(true);
        expect(rows[1].ordinal).toBe(1);
    });
});
