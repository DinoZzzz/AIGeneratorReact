import { describe, it, expect } from 'vitest';
import {
    getCriteria,
    calculateWaterLoss,
    calculateWaterVolumeLoss,
    calculateWettedShaftSurface,
    calculateWettedPipeSurface,
    calculateAllowedLossL,
    calculateAllowedLossMm,
    calculateResult,
    calculateHydrostaticHeight,
    calculateWaterReport,
    isWaterSatisfying
} from './waterCalculations';
import type { ReportForm } from '../../../types';

const PI = Math.PI;

/** Helper to create a minimal ReportForm for testing */
const makeReport = (overrides: Partial<ReportForm> = {}): ReportForm => ({
    id: 'test-1',
    ordinal: 1,
    user_id: 'user-1',
    type_id: 1,
    draft_id: 1,
    material_type_id: 1,
    temperature: 15,
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
    examination_date: '2026-01-01',
    satisfies: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
});

// ─── getCriteria ───────────────────────────────────────────────
describe('getCriteria', () => {
    it('returns 0.401 for Schema A (draft 1 – Shaft only)', () => {
        expect(getCriteria(1)).toBe(0.401);
    });

    it('returns 0.15 for Schema C (draft 2 – Pipe only)', () => {
        expect(getCriteria(2)).toBe(0.15);
    });

    it('returns 0.201 for Schema B (draft 3 – Shaft + Pipe)', () => {
        expect(getCriteria(3)).toBe(0.201);
    });

    it('returns 0.401 for Schema D (draft 4 – Gully only)', () => {
        expect(getCriteria(4)).toBe(0.401);
    });

    it('returns 0.201 for Schema E (draft 5 – Gully + Pipe)', () => {
        expect(getCriteria(5)).toBe(0.201);
    });

    it('returns 0 for an unknown draft', () => {
        expect(getCriteria(99)).toBe(0);
    });
});

// ─── calculateWaterLoss ────────────────────────────────────────
describe('calculateWaterLoss', () => {
    it('returns absolute difference', () => {
        expect(calculateWaterLoss(10, 5)).toBe(5);
        expect(calculateWaterLoss(5, 10)).toBe(5);
    });

    it('returns 0 when start equals end', () => {
        expect(calculateWaterLoss(7, 7)).toBe(0);
    });
});

// ─── calculateWaterVolumeLoss ──────────────────────────────────
describe('calculateWaterVolumeLoss', () => {
    it('calculates for round shaft (type 1)', () => {
        // loss * d^2 * PI / 4, d = 1m, loss = 2mm
        const expected = 2 * (1 * 1 * PI / 4);
        expect(calculateWaterVolumeLoss(2, 1, 1)).toBeCloseTo(expected);
    });

    it('calculates for rectangular shaft (type 2)', () => {
        // loss * width * length
        expect(calculateWaterVolumeLoss(3, 2, 0, 2, 4)).toBe(24);
    });

    it('returns 0 for unknown material type', () => {
        expect(calculateWaterVolumeLoss(5, 99)).toBe(0);
    });

    it('returns 0 when loss is 0', () => {
        expect(calculateWaterVolumeLoss(0, 1, 2)).toBe(0);
    });
});

// ─── calculateWettedShaftSurface ───────────────────────────────
describe('calculateWettedShaftSurface', () => {
    it('returns 0 for draftId 6', () => {
        expect(calculateWettedShaftSurface(6, 1, 2, 1)).toBe(0);
    });

    it('calculates for round shaft – bottom + sides', () => {
        // d=1m, h=2m → bottom = PI/4, side = PI*2 → PI/4 + 2PI
        const d = 1, h = 2;
        const expected = (d * d * PI / 4) + (d * PI * h);
        expect(calculateWettedShaftSurface(1, 1, h, d)).toBeCloseTo(expected);
    });

    it('calculates for rectangular shaft', () => {
        // w=2, l=3, h=1 → bottom=6, sides=2*(3*1)+2*(2*1)=10 → 16
        expect(calculateWettedShaftSurface(1, 2, 1, 0, 2, 3)).toBe(16);
    });

    it('returns 0 for unknown material type', () => {
        expect(calculateWettedShaftSurface(1, 99, 2, 1)).toBe(0);
    });
});

// ─── calculateWettedPipeSurface ────────────────────────────────
describe('calculateWettedPipeSurface', () => {
    it('returns 0 for draft 1 (shaft only) and 4 (gully only)', () => {
        expect(calculateWettedPipeSurface(1, 0.5, 10)).toBe(0);
        expect(calculateWettedPipeSurface(4, 0.5, 10)).toBe(0);
    });

    it('calculates end cap + side for pipe-included drafts', () => {
        // d=0.3m, l=50m → endcap = round2(0.3^2*PI/4) + side = 0.3*PI*50
        const d = 0.3, l = 50;
        const endCap = Math.round(d * d * PI / 4 * 100) / 100;
        const side = d * PI * l;
        expect(calculateWettedPipeSurface(3, d, l)).toBeCloseTo(endCap + side, 1);
    });
});

// ─── calculateAllowedLossL ─────────────────────────────────────
describe('calculateAllowedLossL', () => {
    it('returns criteria * totalWettedArea rounded to 2 decimals', () => {
        expect(calculateAllowedLossL(0.401, 10)).toBeCloseTo(4.01, 2);
        expect(calculateAllowedLossL(0.15, 20)).toBeCloseTo(3.0, 2);
    });
});

// ─── calculateAllowedLossMm ────────────────────────────────────
describe('calculateAllowedLossMm', () => {
    it('calculates for round shaft', () => {
        // allowedLossL / (d^2 * PI/4)
        const d = 1;
        const area = d * d * PI / 4;
        const result = calculateAllowedLossMm(4, 1, d);
        expect(result).toBeCloseTo(Math.round(4 / area * 100) / 100, 2);
    });

    it('calculates for rectangular shaft', () => {
        // allowedLossL / (w * l)
        expect(calculateAllowedLossMm(6, 2, 0, 2, 3)).toBeCloseTo(1, 2);
    });

    it('returns 0 when shaft area is 0', () => {
        expect(calculateAllowedLossMm(5, 1, 0)).toBe(0);
    });
});

// ─── calculateResult ───────────────────────────────────────────
describe('calculateResult', () => {
    it('divides volume loss by area', () => {
        expect(calculateResult(10, 5)).toBe(2);
    });

    it('returns 0 when area is 0', () => {
        expect(calculateResult(10, 0)).toBe(0);
    });
});

// ─── isWaterSatisfying ─────────────────────────────────────────
describe('isWaterSatisfying', () => {
    it('returns true when result equals criteria (boundary)', () => {
        expect(isWaterSatisfying(0.401, 0.401)).toBe(true);
    });

    it('returns true when result < criteria', () => {
        expect(isWaterSatisfying(0.10, 0.401)).toBe(true);
    });

    it('returns false when result > criteria', () => {
        expect(isWaterSatisfying(0.50, 0.401)).toBe(false);
    });
});

// ─── calculateHydrostaticHeight ────────────────────────────────
describe('calculateHydrostaticHeight', () => {
    it('returns waterHeight - pipeDiameter for standard drafts', () => {
        expect(calculateHydrostaticHeight(3, 2.5, 0.3)).toBeCloseTo(2.2);
    });

    it('uses depositional height for draftId 8', () => {
        // |waterHeight - depositionalHeight - pipeDiameter|
        expect(calculateHydrostaticHeight(8, 2.5, 0.3, 0.2)).toBeCloseTo(2.0);
    });
});

// ─── calculateWaterReport (end-to-end) ─────────────────────────
describe('calculateWaterReport', () => {
    it('calculates correct results for Schema A – round shaft only', () => {
        const form = makeReport({
            draft_id: 1,
            material_type_id: 1,
            pane_diameter: 1.0, // 1m
            water_height: 2.0, // 2m
            water_height_start: 500, // mm
            water_height_end: 498, // mm → loss = 2mm
        });

        const result = calculateWaterReport(form);

        expect(result.waterLoss).toBe(2);
        // Volume = 2 * (1^2 * PI/4) = PI/2 ≈ 1.5708
        expect(result.waterVolumeLoss).toBeCloseTo(PI / 2, 3);
        // Shaft surface = (PI/4) + (PI*2) = PI*(1/4 + 2) = PI*2.25
        expect(result.wettedShaftSurface).toBeCloseTo(PI * 2.25, 3);
        expect(result.wettedPipeSurface).toBe(0); // No pipe for draft 1
        expect(result.totalWettedArea).toBeCloseTo(PI * 2.25, 3);

        const criteria = 0.401;
        expect(result.allowedLossL).toBeCloseTo(
            Math.round(criteria * PI * 2.25 * 100) / 100, 2
        );
        expect(result.satisfies).toBe(true);
    });

    it('calculates correct results for Schema B – shaft + pipe', () => {
        const form = makeReport({
            draft_id: 3,
            material_type_id: 1,
            pane_diameter: 1.0,
            water_height: 2.0,
            pipe_diameter: 0.3,
            pipe_length: 10,
            water_height_start: 100,
            water_height_end: 99,
        });

        const result = calculateWaterReport(form);

        expect(result.waterLoss).toBe(1);
        expect(result.wettedPipeSurface).toBeGreaterThan(0);
        expect(result.totalWettedArea).toBeGreaterThan(result.wettedShaftSurface);
    });

    it('calculates correct results for Schema C – pipe only', () => {
        const form = makeReport({
            draft_id: 2,
            material_type_id: 1,
            pane_diameter: 0.5,
            pipe_diameter: 0.2,
            pipe_length: 20,
            water_height: 1.5,
            water_height_start: 50,
            water_height_end: 49,
        });

        const result = calculateWaterReport(form);
        expect(result.wettedPipeSurface).toBeGreaterThan(0);
    });

    it('handles all-zero dimensions gracefully', () => {
        const form = makeReport({
            draft_id: 1,
            material_type_id: 1,
            pane_diameter: 0,
            water_height: 0,
            water_height_start: 0,
            water_height_end: 0,
        });

        const result = calculateWaterReport(form);
        expect(result.waterLoss).toBe(0);
        expect(result.waterVolumeLoss).toBe(0);
        expect(result.totalWettedArea).toBe(0);
        expect(result.result).toBe(0);
        expect(result.satisfies).toBe(true);
    });

    it('marks failing test when result exceeds criteria', () => {
        const form = makeReport({
            draft_id: 2, // Criteria = 0.15
            material_type_id: 1,
            pane_diameter: 0.1, // Very small shaft
            water_height: 0.1,
            pipe_diameter: 0.1,
            pipe_length: 0.1,
            water_height_start: 100,
            water_height_end: 0, // 100mm loss = huge
        });

        const result = calculateWaterReport(form);
        expect(result.satisfies).toBe(false);
    });

    it('works with rectangular shaft (Schema A)', () => {
        const form = makeReport({
            draft_id: 1,
            material_type_id: 2,
            pane_width: 1.0,
            pane_length: 1.5,
            water_height: 2.0,
            water_height_start: 200,
            water_height_end: 198,
        });

        const result = calculateWaterReport(form);
        expect(result.waterLoss).toBe(2);
        // Volume = 2 * 1.0 * 1.5 = 3
        expect(result.waterVolumeLoss).toBe(3);
        // Shaft = (1.5*1) + 2*(1.5*2) + 2*(1*2) = 1.5 + 6 + 4 = 11.5
        expect(result.wettedShaftSurface).toBe(11.5);
    });
});
