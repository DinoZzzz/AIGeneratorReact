/**
 * Core calculations for Report Forms.
 * Ported from C# ReportForm.cs
 */

import type { ReportForm } from '../../types';

export interface ReportFormCalculations {
    // Inputs
    draftId: number;
    materialTypeId: number; // 1 = Shaft, 2 = Pipe

    // Dimensions (in meters)
    paneDiameter?: number; // Shaft
    paneWidth?: number; // Rectangular Shaft
    paneLength?: number; // Rectangular Shaft
    paneHeight?: number; // Rectangular Shaft

    pipeDiameter?: number;
    pipeLength?: number;

    waterHeight: number;
    waterHeightStart: number; // Usually in mm or cm, need to verify unit consistency
    waterHeightEnd: number;

    pressureStart?: number;
    pressureEnd?: number;

    depositionalHeight?: number;
}

const PI = Math.PI;

// Helper to round to 2 decimal places
const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const calculateWaterLoss = (start: number, end: number): number => {
    return Math.abs(end - start);
};

export const calculatePressureLoss = (start: number, end: number): number => {
    return Math.abs(end - start);
};

export const calculateWaterVolumeLoss = (
    loss: number,
    materialTypeId: number,
    paneDiameter: number = 0,
    paneWidth: number = 0,
    paneLength: number = 0
): number => {
    if (materialTypeId === 1) {
        // Round Shaft
        return loss * paneDiameter * paneDiameter * PI / 4;
    } else if (materialTypeId === 2) {
        // Rectangular Shaft
        return loss * paneWidth * paneLength;
    }
    return 0;
};

export const calculateWettedShaftSurface = (
    draftId: number,
    materialTypeId: number,
    waterHeight: number,
    paneDiameter: number = 0,
    paneWidth: number = 0,
    paneLength: number = 0
): number => {
    if (draftId === 6) return 0;

    if (materialTypeId === 1) {
        // Round Shaft
        return (paneDiameter * paneDiameter * PI / 4) + (paneDiameter * PI * waterHeight);
    } else if (materialTypeId === 2) {
        // Rectangular Shaft
        return (paneLength * paneWidth) + 2 * (paneLength * waterHeight) + 2 * (paneWidth * waterHeight);
    }
    return 0;
};

export const calculateWettedPipeSurface = (
    draftId: number,
    pipeDiameter: number,
    pipeLength: number
): number => {
    if (draftId === 1 || draftId === 4) return 0;
    return round2(pipeDiameter * pipeDiameter * PI / 4) + (pipeDiameter * PI * pipeLength);
};

export const calculateTotalWettedArea = (
    wettedPipeSurface: number,
    wettedShaftSurface: number
): number => {
    return wettedPipeSurface + wettedShaftSurface;
};

export const getCriteria = (draftId: number): number => {
    if (draftId === 1) return 0.401;
    else if (draftId === 2) return 0.201;
    else if (draftId === 3) return 0.15;
    return 0;
};

export const calculateAllowedLossL = (
    criteria: number,
    totalWettedArea: number
): number => {
    return round2(criteria * totalWettedArea);
};

export const calculateAllowedLossMm = (
    allowedLossL: number,
    materialTypeId: number,
    paneDiameter: number = 0,
    paneWidth: number = 0,
    paneLength: number = 0
): number => {
    let val = 1;
    if (materialTypeId === 1) {
        val = paneDiameter * paneDiameter * PI / 4;
    } else if (materialTypeId === 2) {
        val = paneLength * paneWidth;
    }

    return val === 0 ? 0 : round2(allowedLossL / val);
};

export const calculateResult = (
    waterVolumeLoss: number,
    totalWettedArea: number
): number => {
    return round2(totalWettedArea === 0 ? 0 : waterVolumeLoss / totalWettedArea);
};

export const isSatisfying = (
    result: number,
    criteria: number,
    typeId: number, // 1 = Water, 2 = Air
    pressureLoss: number = 0,
    allowedPressureLoss: number = 0
): boolean => {
    if (typeId === 1) {
        return result <= criteria;
    } else {
        return pressureLoss <= allowedPressureLoss;
    }
};

export const calculateHydrostaticHeight = (
    draftId: number,
    waterHeight: number,
    pipeDiameter: number,
    depositionalHeight: number = 0
): number => {
    if (draftId === 8) {
        return Math.abs(waterHeight - depositionalHeight - pipeDiameter);
    }
    return waterHeight - pipeDiameter;
};

// Wrapper functions for forms
export const calculateWaterReport = (form: ReportForm) => {
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
    const result = calculateResult(waterVolumeLoss, totalWettedArea);
    const satisfies = isSatisfying(result, criteria, 1);

    return {
        waterLoss,
        waterVolumeLoss,
        totalWettedArea,
        allowedLossL,
        result,
        satisfies
    };
};

export const calculateAirReport = (form: ReportForm, allowedLoss: number = 0.10) => {
    const pressureLoss = calculatePressureLoss(form.pressure_start, form.pressure_end);
    const satisfies = isSatisfying(0, 0, 2, pressureLoss, allowedLoss);

    return {
        pressureLoss,
        allowedLoss,
        satisfies
    };
};
