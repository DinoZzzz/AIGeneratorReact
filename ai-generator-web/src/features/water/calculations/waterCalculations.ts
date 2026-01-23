/**
 * Water Method Calculations
 * All calculations specific to water testing method (type_id = 1)
 */

import type { ReportForm } from '../../../types';

const PI = Math.PI;

// Helper to round to 2 decimal places
const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export interface WaterReportCalculations {
    waterLoss: number;
    waterVolumeLoss: number;
    wettedShaftSurface: number;
    wettedPipeSurface: number;
    totalWettedArea: number;
    allowedLossL: number;
    allowedLossMm: number;
    hydrostaticHeight: number;
    result: number;
    satisfies: boolean;
}

/**
 * Calculate water loss (difference between start and end water height)
 */
export const calculateWaterLoss = (start: number, end: number): number => {
    return Math.abs(end - start);
};

/**
 * Calculate water volume loss based on shaft geometry
 */
export const calculateWaterVolumeLoss = (
    loss: number, // in mm
    materialTypeId: number,
    paneDiameter: number = 0, // m
    paneWidth: number = 0, // m
    paneLength: number = 0 // m
): number => {
    // Loss is in mm. Surface area * height change.
    // Area in m^2. Height in mm -> m: height/1000.
    // Volume in m^3. 1 m^3 = 1000 L.
    // Effectively: Area (m^2) * loss (mm) = Liters.

    if (materialTypeId === 1) {
        // Round Shaft
        return loss * (paneDiameter * paneDiameter * PI / 4);
    } else if (materialTypeId === 2) {
        // Rectangular Shaft
        return loss * (paneWidth * paneLength);
    }
    return 0;
};

/**
 * Calculate wetted shaft surface area
 * Function expects dimensions in METERS
 */
export const calculateWettedShaftSurface = (
    draftId: number,
    materialTypeId: number,
    waterHeight: number, // m
    paneDiameter: number = 0, // m
    paneWidth: number = 0, // m
    paneLength: number = 0 // m
): number => {
    if (draftId === 6) return 0;

    if (materialTypeId === 1) {
        // Round Shaft / Gully
        return (paneDiameter * paneDiameter * PI / 4) + (paneDiameter * PI * waterHeight);
    } else if (materialTypeId === 2) {
        // Rectangular Shaft / Gully
        return (paneLength * paneWidth) + 2 * (paneLength * waterHeight) + 2 * (paneWidth * waterHeight);
    }
    return 0;
};

/**
 * Calculate wetted pipe surface area
 */
export const calculateWettedPipeSurface = (
    draftId: number,
    pipeDiameter: number, // m
    pipeLength: number // m
): number => {
    // Exclude Shaft Only (1) and Gully Only (4)
    if (draftId === 1 || draftId === 4) return 0;
    return round2(pipeDiameter * pipeDiameter * PI / 4) + (pipeDiameter * PI * pipeLength);
};

/**
 * Calculate total wetted area (pipe + shaft)
 */
export const calculateTotalWettedArea = (
    wettedPipeSurface: number,
    wettedShaftSurface: number
): number => {
    return wettedPipeSurface + wettedShaftSurface;
};

/**
 * Get criteria (allowed loss per m²) based on draft/scheme
 * Draft 1 (Scheme A): Shaft only - 0.401 L/m²
 * Draft 2 (Scheme C): Pipe only - 0.15 L/m²
 * Draft 3 (Scheme B): Shaft + Pipe - 0.201 L/m²
 * Draft 4 (Scheme D): Gully only - 0.401 L/m²
 * Draft 5 (Scheme E): Gully + Pipe - 0.201 L/m²
 */
export const getCriteria = (draftId: number): number => {
    if (draftId === 1) return 0.401; // Shaft (Scheme A)
    else if (draftId === 2) return 0.15; // Pipe (Scheme C)
    else if (draftId === 3) return 0.201; // Shaft + Pipe (Scheme B)
    else if (draftId === 4) return 0.401; // Gully (Scheme D)
    else if (draftId === 5) return 0.201; // Gully + Pipe (Scheme E)
    return 0;
};

/**
 * Calculate allowed loss in liters
 */
export const calculateAllowedLossL = (
    criteria: number,
    totalWettedArea: number
): number => {
    return round2(criteria * totalWettedArea);
};

/**
 * Calculate allowed loss in mm
 */
export const calculateAllowedLossMm = (
    allowedLossL: number,
    materialTypeId: number,
    paneDiameter: number = 0,
    paneWidth: number = 0,
    paneLength: number = 0
): number => {
    let area = 1;
    if (materialTypeId === 1) {
        area = paneDiameter * paneDiameter * PI / 4;
    } else if (materialTypeId === 2) {
        area = paneLength * paneWidth;
    }

    return area === 0 ? 0 : round2(allowedLossL / area);
};

/**
 * Calculate result (measured loss per unit area)
 */
export const calculateResult = (
    waterVolumeLoss: number,
    totalWettedArea: number
): number => {
    return round2(totalWettedArea === 0 ? 0 : waterVolumeLoss / totalWettedArea);
};

/**
 * Check if water test result satisfies criteria
 */
export const isWaterSatisfying = (result: number, criteria: number): boolean => {
    return result <= criteria;
};

/**
 * Calculate hydrostatic height
 */
export const calculateHydrostaticHeight = (
    draftId: number,
    waterHeight: number, // m
    pipeDiameter: number, // m
    depositionalHeight: number = 0 // m
): number => {
    if (draftId === 8) {
        return Math.abs(waterHeight - depositionalHeight - pipeDiameter);
    }
    return waterHeight - pipeDiameter;
};

/**
 * Main wrapper function to calculate all water report values
 */
export const calculateWaterReport = (form: ReportForm): WaterReportCalculations => {
    const waterLoss = calculateWaterLoss(form.water_height_start, form.water_height_end);

    const waterVolumeLoss = calculateWaterVolumeLoss(
        waterLoss,
        form.material_type_id || 1,
        form.pane_diameter,
        form.pane_width,
        form.pane_length
    );

    const wettedShaftSurface = calculateWettedShaftSurface(
        form.draft_id,
        form.material_type_id || 1,
        form.water_height,
        form.pane_diameter,
        form.pane_width,
        form.pane_length
    );

    const wettedPipeSurface = calculateWettedPipeSurface(
        form.draft_id,
        form.pipe_diameter,
        form.pipe_length
    );

    const totalWettedArea = calculateTotalWettedArea(wettedPipeSurface, wettedShaftSurface);
    const criteria = getCriteria(form.draft_id);
    const allowedLossL = calculateAllowedLossL(criteria, totalWettedArea);
    const allowedLossMm = calculateAllowedLossMm(
        allowedLossL,
        form.material_type_id || 1,
        form.pane_diameter,
        form.pane_width,
        form.pane_length
    );
    const result = calculateResult(waterVolumeLoss, totalWettedArea);
    const satisfies = isWaterSatisfying(result, criteria);

    const hydrostaticHeight = calculateHydrostaticHeight(
        form.draft_id,
        form.water_height,
        form.pipe_diameter,
        form.depositional_height
    );

    return {
        waterLoss,
        waterVolumeLoss,
        wettedShaftSurface,
        wettedPipeSurface,
        totalWettedArea,
        allowedLossL,
        allowedLossMm,
        hydrostaticHeight,
        result,
        satisfies
    };
};
