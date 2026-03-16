import { describe, it, expect } from 'vitest';
import {
    calculatePressureLoss,
    isAirSatisfying,
    calculateAirReport,
    getAirTestRequirements,
    getMethodFromProcedureName,
    getMethodFromProcedureId,
    getProcedureIdFromPressure,
    formatTime,
    AIR_TEST_STANDARDS
} from './airCalculations';
import type { ReportForm } from '../../../types';

/** Helper to create a minimal air ReportForm */
const makeAirReport = (overrides: Partial<ReportForm> = {}): ReportForm => ({
    id: 'air-1',
    ordinal: 1,
    user_id: 'user-1',
    type_id: 2,
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

// ─── calculatePressureLoss ─────────────────────────────────────
describe('calculatePressureLoss', () => {
    it('returns absolute difference', () => {
        expect(calculatePressureLoss(100, 95)).toBe(5);
        expect(calculatePressureLoss(95, 100)).toBe(5);
    });

    it('returns 0 when pressures are equal', () => {
        expect(calculatePressureLoss(50, 50)).toBe(0);
    });
});

// ─── isAirSatisfying ───────────────────────────────────────────
describe('isAirSatisfying', () => {
    it('returns true when loss < allowed', () => {
        expect(isAirSatisfying(2, 2.5)).toBe(true);
    });

    it('returns true when loss equals allowed (boundary)', () => {
        expect(isAirSatisfying(2.5, 2.5)).toBe(true);
    });

    it('returns false when loss > allowed', () => {
        expect(isAirSatisfying(3, 2.5)).toBe(false);
    });
});

// ─── calculateAirReport ────────────────────────────────────────
describe('calculateAirReport', () => {
    it('calculates passing result', () => {
        const form = makeAirReport({
            pressure_start: 10,
            pressure_end: 8,
        });

        const result = calculateAirReport(form, 2.5);
        expect(result.pressureLoss).toBe(2);
        expect(result.allowedLoss).toBe(2.5);
        expect(result.satisfies).toBe(true);
    });

    it('calculates failing result', () => {
        const form = makeAirReport({
            pressure_start: 10,
            pressure_end: 5,
        });

        const result = calculateAirReport(form, 2.5);
        expect(result.pressureLoss).toBe(5);
        expect(result.satisfies).toBe(false);
    });
});

// ─── AIR_TEST_STANDARDS ────────────────────────────────────────
describe('AIR_TEST_STANDARDS', () => {
    it('has CONCRETE and OTHER materials', () => {
        expect(AIR_TEST_STANDARDS).toHaveProperty('CONCRETE');
        expect(AIR_TEST_STANDARDS).toHaveProperty('OTHER');
    });

    it('has all four methods per material', () => {
        for (const material of ['CONCRETE', 'OTHER'] as const) {
            for (const method of ['LA', 'LB', 'LC', 'LD'] as const) {
                expect(AIR_TEST_STANDARDS[material][method]).toBeDefined();
                expect(AIR_TEST_STANDARDS[material][method].pressure).toBeGreaterThan(0);
                expect(AIR_TEST_STANDARDS[material][method].allowedDrop).toBeGreaterThan(0);
            }
        }
    });

    it('has correct pressures per method', () => {
        expect(AIR_TEST_STANDARDS.CONCRETE.LA.pressure).toBe(10);
        expect(AIR_TEST_STANDARDS.CONCRETE.LB.pressure).toBe(50);
        expect(AIR_TEST_STANDARDS.CONCRETE.LC.pressure).toBe(100);
        expect(AIR_TEST_STANDARDS.CONCRETE.LD.pressure).toBe(200);
    });

    it('has correct allowed drops per method', () => {
        expect(AIR_TEST_STANDARDS.CONCRETE.LA.allowedDrop).toBe(2.5);
        expect(AIR_TEST_STANDARDS.CONCRETE.LB.allowedDrop).toBe(10);
        expect(AIR_TEST_STANDARDS.CONCRETE.LC.allowedDrop).toBe(15);
        expect(AIR_TEST_STANDARDS.CONCRETE.LD.allowedDrop).toBe(15);
    });
});

// ─── getAirTestRequirements ────────────────────────────────────
describe('getAirTestRequirements', () => {
    it('returns correct values for LA/CONCRETE at exact diameter', () => {
        const req = getAirTestRequirements('LA', 'CONCRETE', 400);
        expect(req.requiredTime).toBe(7);
        expect(req.allowedDrop).toBe(2.5);
        expect(req.testPressure).toBe(10);
    });

    it('rounds up to next diameter when between table values', () => {
        // 350mm → next is 400
        const req = getAirTestRequirements('LA', 'CONCRETE', 350);
        expect(req.requiredTime).toBe(7);
    });

    it('caps at 1000mm for large diameters', () => {
        const req = getAirTestRequirements('LB', 'OTHER', 1500);
        expect(req.requiredTime).toBe(19); // 1000mm OTHER LB
    });

    it('uses 100mm for very small diameters', () => {
        const req = getAirTestRequirements('LC', 'CONCRETE', 50);
        expect(req.requiredTime).toBe(3); // 100mm CONCRETE LC
    });

    it('returns correct values for OTHER material', () => {
        const req = getAirTestRequirements('LD', 'OTHER', 1000);
        expect(req.requiredTime).toBe(7);
        expect(req.allowedDrop).toBe(15);
        expect(req.testPressure).toBe(200);
    });
});

// ─── getMethodFromProcedureId ──────────────────────────────────
describe('getMethodFromProcedureId', () => {
    it('maps IDs to methods correctly', () => {
        expect(getMethodFromProcedureId(1)).toBe('LA');
        expect(getMethodFromProcedureId(2)).toBe('LB');
        expect(getMethodFromProcedureId(3)).toBe('LC');
        expect(getMethodFromProcedureId(4)).toBe('LD');
    });

    it('defaults to LA for unknown ID', () => {
        expect(getMethodFromProcedureId(99)).toBe('LA');
    });
});

// ─── getMethodFromProcedureName ────────────────────────────────
describe('getMethodFromProcedureName', () => {
    it('parses standard method names', () => {
        expect(getMethodFromProcedureName('LA')).toBe('LA');
        expect(getMethodFromProcedureName('LB')).toBe('LB');
        expect(getMethodFromProcedureName('LC')).toBe('LC');
        expect(getMethodFromProcedureName('LD')).toBe('LD');
    });

    it('is case insensitive', () => {
        expect(getMethodFromProcedureName('la')).toBe('LA');
        expect(getMethodFromProcedureName('Lb')).toBe('LB');
    });

    it('handles names containing method identifier', () => {
        expect(getMethodFromProcedureName('Postupak LB')).toBe('LB');
    });

    it('defaults to LA for undefined or unrecognized', () => {
        expect(getMethodFromProcedureName(undefined)).toBe('LA');
        expect(getMethodFromProcedureName('')).toBe('LA');
        expect(getMethodFromProcedureName('unknown')).toBe('LA');
    });
});

// ─── getProcedureIdFromPressure ────────────────────────────────
describe('getProcedureIdFromPressure', () => {
    it('returns LD for pressures >= 200', () => {
        expect(getProcedureIdFromPressure(200)).toBe(4);
        expect(getProcedureIdFromPressure(300)).toBe(4);
    });

    it('returns LC for pressures >= 100 and < 200', () => {
        expect(getProcedureIdFromPressure(100)).toBe(3);
        expect(getProcedureIdFromPressure(150)).toBe(3);
    });

    it('returns LB for pressures >= 50 and < 100', () => {
        expect(getProcedureIdFromPressure(50)).toBe(2);
        expect(getProcedureIdFromPressure(75)).toBe(2);
    });

    it('returns LA for pressures < 50', () => {
        expect(getProcedureIdFromPressure(10)).toBe(1);
        expect(getProcedureIdFromPressure(0)).toBe(1);
    });
});

// ─── formatTime ────────────────────────────────────────────────
describe('formatTime', () => {
    it('formats minutes correctly', () => {
        expect(formatTime(5)).toBe('00:05');
        expect(formatTime(30)).toBe('00:30');
    });

    it('handles hours', () => {
        expect(formatTime(90)).toBe('01:30');
        expect(formatTime(120)).toBe('02:00');
    });

    it('handles zero', () => {
        expect(formatTime(0)).toBe('00:00');
    });
});
