import { describe, it, expect } from 'vitest';
import {
    calculatePressureLoss,
    calculateWaterVolumeLoss,
    calculateTotalWettedArea,
    calculateAllowedLossL,
    calculateResult
} from '../src/lib/calculations';
import type { ReportForm } from '../src/types';

// Mock Report Data based on C# assumptions
// Assuming meters for dimensions unless specified otherwise
const mockWaterReport: ReportForm = {
    id: '1',
    ordinal: 1,
    user_id: 'user1',
    type_id: 1, // Water
    draft_id: 2, // cjevovod + reviziono okno = 0.2 l/m^2
    material_type_id: 1, // Round
    pane_diameter: 1.0, // 1 meter
    water_height_start: 0.5,
    water_height_end: 0.45, // Loss 0.05m
    water_height: 2.0,
    pipe_diameter: 0.5,
    pipe_length: 10.0,
    pressure_start: 0,
    pressure_end: 0,
    temperature: 20,
    pipeline_slope: 0,
    pane_width: 0,
    pane_height: 0,
    pane_length: 0,
    saturation_of_test_section: 0,
    ro_height: 0,
    depositional_height: 0,
    examination_date: new Date().toISOString(),
    satisfies: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

describe('Calculations', () => {
    it('calculates water volume loss correctly (Round)', () => {
        // Loss = 0.05m
        // Volume = Loss * (D^2 * PI / 4)
        // 0.05 * (1^2 * PI / 4) = 0.05 * 0.785398 = 0.0392699...
        const loss = calculateWaterVolumeLoss(mockWaterReport);
        expect(loss).toBeCloseTo(0.03927, 4);
    });

    it('calculates total wetted area correctly', () => {
        // Shaft (Round): Bottom + Side
        // Bottom = 1^2 * PI / 4 = 0.7854
        // Side = 1 * PI * 2.0 = 6.2832
        // Total Shaft = 7.0686

        // Pipe (Round): End + Side
        // End = 0.5^2 * PI / 4 = 0.1963
        // Side = 0.5 * PI * 10 = 15.708
        // Total Pipe = 15.9043

        // Total = 22.9729
        const area = calculateTotalWettedArea(mockWaterReport);
        expect(area).toBeCloseTo(22.973, 2);
    });

    it('calculates allowed loss correctly', () => {
        // Criteria for DraftId 2 = 0.201 (from C# GetCriteria)
        // Allowed = Criteria * TotalWettedArea
        // 0.201 * 22.9729 = 4.617...
        const allowed = calculateAllowedLossL(mockWaterReport);
        expect(allowed).toBeCloseTo(4.62, 2);
    });

    it('calculates pressure loss correctly', () => {
        const airReport = { ...mockWaterReport, type_id: 2, pressure_start: 100, pressure_end: 95 };
        expect(calculatePressureLoss(airReport)).toBe(5);
    });
});
