/**
 * Air Method Calculations
 * All calculations specific to air testing method (type_id = 2)
 */

import type { ReportForm } from '../../../types';

export type AirTestMethod = 'LA' | 'LB' | 'LC' | 'LD';
export type PipeMaterial = 'CONCRETE' | 'OTHER';

interface AirTestStandard {
    pressure: number; // p0 (mbar)
    allowedDrop: number; // dp (mbar)
    times: Record<number, number>; // diameter (mm) -> time (min)
}

export interface AirReportCalculations {
    pressureLoss: number;
    allowedLoss: number;
    satisfies: boolean;
    testTime: string;
    requiredTestTime: number; // in minutes
}

// Standard diameters in the table
const DIAMETERS = [100, 200, 300, 400, 600, 800, 1000];

/**
 * EN 1610 Air Test Standards
 * Defines test parameters for different pipe materials and test methods
 */
export const AIR_TEST_STANDARDS: Record<PipeMaterial, Record<AirTestMethod, AirTestStandard>> = {
    CONCRETE: {
        LA: {
            pressure: 10,
            allowedDrop: 2.5,
            times: { 100: 5, 200: 5, 300: 5, 400: 7, 600: 11, 800: 14, 1000: 18 }
        },
        LB: {
            pressure: 50,
            allowedDrop: 10,
            times: { 100: 4, 200: 4, 300: 4, 400: 6, 600: 8, 800: 11, 1000: 14 }
        },
        LC: {
            pressure: 100,
            allowedDrop: 15,
            times: { 100: 3, 200: 3, 300: 3, 400: 4, 600: 6, 800: 8, 1000: 10 }
        },
        LD: {
            pressure: 200,
            allowedDrop: 15,
            times: { 100: 1.5, 200: 1.5, 300: 1.5, 400: 2, 600: 3, 800: 4, 1000: 5 }
        }
    },
    OTHER: {
        LA: {
            pressure: 10,
            allowedDrop: 2.5,
            times: { 100: 5, 200: 5, 300: 7, 400: 10, 600: 14, 800: 19, 1000: 24 }
        },
        LB: {
            pressure: 50,
            allowedDrop: 10,
            times: { 100: 4, 200: 4, 300: 6, 400: 7, 600: 11, 800: 15, 1000: 19 }
        },
        LC: {
            pressure: 100,
            allowedDrop: 15,
            times: { 100: 3, 200: 3, 300: 4, 400: 5, 600: 6, 800: 11, 1000: 14 }
        },
        LD: {
            pressure: 200,
            allowedDrop: 15,
            times: { 100: 1.5, 200: 1.5, 300: 2, 400: 2.5, 600: 4, 800: 5, 1000: 7 }
        }
    }
};

/**
 * Get air test requirements based on method, material, and diameter
 */
export function getAirTestRequirements(
    method: AirTestMethod,
    material: PipeMaterial,
    diameterMm: number
): { requiredTime: number; allowedDrop: number; testPressure: number } {
    const standard = AIR_TEST_STANDARDS[material][method];

    // Find the closest diameter in the table (rounding up)
    let targetDiameter = DIAMETERS.find(d => d >= diameterMm);
    if (!targetDiameter) targetDiameter = 1000; // Cap at 1000

    // If diameter is smaller than 100, use 100
    if (diameterMm < 100) targetDiameter = 100;

    const requiredTime = standard.times[targetDiameter];

    return {
        requiredTime,
        allowedDrop: standard.allowedDrop,
        testPressure: standard.pressure
    };
}

/**
 * Calculate pressure loss (difference between start and end pressure)
 */
export const calculatePressureLoss = (start: number, end: number): number => {
    return Math.abs(end - start);
};

/**
 * Check if air test result satisfies criteria
 */
export const isAirSatisfying = (
    pressureLoss: number,
    allowedPressureLoss: number
): boolean => {
    return pressureLoss <= allowedPressureLoss;
};

/**
 * Format time in minutes to HH:MM format
 */
export const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Main wrapper function to calculate all air report values
 */
export const calculateAirReport = (form: ReportForm, allowedLoss: number = 0.10): AirReportCalculations => {
    const pressureLoss = calculatePressureLoss(form.pressure_start, form.pressure_end);
    const satisfies = isAirSatisfying(pressureLoss, allowedLoss);

    return {
        pressureLoss,
        allowedLoss,
        satisfies,
        testTime: '00:00',
        requiredTestTime: 0
    };
};

/**
 * Get procedure ID based on pressure
 */
export const getProcedureIdFromPressure = (pressure: number): number => {
    if (pressure >= 200) return 4; // LD
    if (pressure >= 100) return 3; // LC
    if (pressure >= 50) return 2; // LB
    return 1; // LA
};

/**
 * Map procedure ID to method
 * @deprecated Use getMethodFromProcedureName instead - ID order may not match method order
 */
export const getMethodFromProcedureId = (procedureId: number): AirTestMethod => {
    const methodMap: Record<number, AirTestMethod> = {
        1: 'LA',
        2: 'LB',
        3: 'LC',
        4: 'LD'
    };
    return methodMap[procedureId] || 'LA';
};

/**
 * Get method from procedure name (e.g., 'LA', 'LB', 'LC', 'LD')
 * This is more reliable than using procedure ID
 */
export const getMethodFromProcedureName = (procedureName: string | undefined): AirTestMethod => {
    if (!procedureName) return 'LA';

    const name = procedureName.toUpperCase().trim();
    if (name === 'LB' || name.includes('LB')) return 'LB';
    if (name === 'LC' || name.includes('LC')) return 'LC';
    if (name === 'LD' || name.includes('LD')) return 'LD';
    return 'LA';
};
