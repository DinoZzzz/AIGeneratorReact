import type { ReportForm, ExaminationProcedure } from '../types';

const PI = Math.PI;

// Helper to convert cm to meters if needed, but usually inputs are consistent.
// Based on C# code, we assume inputs are already in correct units or need standard conversion.
// C# Note: PipeDiameter seems to be in meters in logic (e.g. CalculateWettedPipeSurface uses it directly).

export const calculatePressureLoss = (report: ReportForm): number => {
    return Math.abs(report.pressure_end - report.pressure_start);
};

export const calculateWaterLoss = (report: ReportForm): number => {
    return Math.abs(report.water_height_end - report.water_height_start);
};

export const calculateWaterVolumeLoss = (report: ReportForm): number => {
    // MaterialTypeId: 1 = Round (Okrugli), 2 = Rectangular (Kvadratni)
    // Note: C# uses MaterialTypeId.
    if (report.material_type_id === 1) {
        // Cylinder volume: h * r^2 * PI -> h * (d/2)^2 * PI = h * d^2 * PI / 4
        return calculateWaterLoss(report) * report.pane_diameter * report.pane_diameter * PI / 4;
    } else if (report.material_type_id === 2) {
        // Box volume: h * w * l
        return calculateWaterLoss(report) * report.pane_width * report.pane_length;
    }
    return 0;
};

export const calculateWettedShaftSurface = (report: ReportForm): number => {
    // DraftId 6 usually implies no shaft or specific type where surface is 0.
    if (report.draft_id === 6) return 0;

    if (report.material_type_id === 1) {
        // Bottom area + Side area
        // Side area = Perimeter * Height = (d * PI) * h
        // Bottom area = d^2 * PI / 4
        return (report.pane_diameter * report.pane_diameter * PI / 4) + (report.pane_diameter * PI * report.water_height);
    } else if (report.material_type_id === 2) {
        // Bottom area + Side area
        // Side area = 2 * (l + w) * h
        // Bottom area = l * w
        return (report.pane_length * report.pane_width) +
            2 * (report.pane_length * report.water_height) +
            2 * (report.pane_width * report.water_height);
    }
    return 0;
};

export const calculateWettedPipeSurface = (report: ReportForm): number => {
    // DraftId 1 or 4 implies no pipe to test (e.g. just shaft test).
    if (report.draft_id === 1 || report.draft_id === 4) return 0;

    // Circle area (End cap?) + Cylinder side area
    // Side area = d * PI * L
    // End cap = d^2 * PI / 4
    // The C# code adds one end cap area + side area.
    return (report.pipe_diameter * report.pipe_diameter * PI / 4) + (report.pipe_diameter * PI * report.pipe_length);
};

export const calculateTotalWettedArea = (report: ReportForm): number => {
    return calculateWettedPipeSurface(report) + calculateWettedShaftSurface(report);
};

const getCriteria = (report: ReportForm): number => {
    if (report.draft_id === 1) return 0.401;
    else if (report.draft_id === 2) return 0.201;
    else if (report.draft_id === 3) return 0.15;
    return 0;
};

export const calculateAllowedLossL = (report: ReportForm): number => {
    // Round to 2 decimals
    const result = getCriteria(report) * calculateTotalWettedArea(report);
    return Math.round(result * 100) / 100;
};

export const calculateResult = (report: ReportForm): number => {
    const total = calculateTotalWettedArea(report);
    const result = total === 0 ? 0 : calculateWaterVolumeLoss(report) / total;
    return Math.round(result * 100) / 100;
};

export const isSatisfying = (report: ReportForm, procedure?: ExaminationProcedure): boolean => {
    // TypeId: 1 = Water, 2 = Air
    if (report.type_id === 1) {
        return calculateResult(report) <= getCriteria(report);
    } else {
        if (!procedure) return false; // Cannot determine without procedure
        const loss = calculatePressureLoss(report);
        // Note: C# code compares loss <= allowedLoss.
        return loss <= procedure.allowed_loss;
    }
};
