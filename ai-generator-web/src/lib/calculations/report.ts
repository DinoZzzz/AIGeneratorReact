/**
 * Core calculations for Report Forms.
 * This file re-exports from the new feature-based modules for backward compatibility.
 *
 * Water calculations: src/features/water/calculations/
 * Air calculations: src/features/air/calculations/
 */

// Re-export water calculations
export {
    calculateWaterLoss,
    calculateWaterVolumeLoss,
    calculateWettedShaftSurface,
    calculateWettedPipeSurface,
    calculateTotalWettedArea,
    getCriteria,
    calculateAllowedLossL,
    calculateAllowedLossMm,
    calculateResult,
    calculateHydrostaticHeight,
    calculateWaterReport,
    isWaterSatisfying,
    type WaterReportCalculations
} from '../../features/water/calculations';

// Re-export air calculations
export {
    calculatePressureLoss,
    calculateAirReport,
    isAirSatisfying,
    getAirTestRequirements,
    formatTime,
    AIR_TEST_STANDARDS,
    type AirTestMethod,
    type PipeMaterial,
    type AirReportCalculations
} from '../../features/air/calculations';

import type { ReportForm } from '../../types';
import { isWaterSatisfying } from '../../features/water/calculations';
import { isAirSatisfying } from '../../features/air/calculations';

// Legacy interface for backward compatibility
export interface ReportFormCalculations {
    draftId: number;
    materialTypeId: number;
    paneDiameter?: number;
    paneWidth?: number;
    paneLength?: number;
    paneHeight?: number;
    pipeDiameter?: number;
    pipeLength?: number;
    waterHeight: number;
    waterHeightStart: number;
    waterHeightEnd: number;
    pressureStart?: number;
    pressureEnd?: number;
    depositionalHeight?: number;
}

/**
 * Legacy unified satisfying check - use isWaterSatisfying or isAirSatisfying instead
 * @deprecated Use isWaterSatisfying or isAirSatisfying from respective modules
 */
export const isSatisfying = (
    result: number,
    criteria: number,
    typeId: number,
    pressureLoss: number = 0,
    allowedPressureLoss: number = 0
): boolean => {
    if (typeId === 1) {
        return isWaterSatisfying(result, criteria);
    } else {
        return isAirSatisfying(pressureLoss, allowedPressureLoss);
    }
};
