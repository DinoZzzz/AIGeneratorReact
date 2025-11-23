
export type AirTestMethod = 'LA' | 'LB' | 'LC' | 'LD';
export type PipeMaterial = 'CONCRETE' | 'OTHER';

interface AirTestStandard {
    pressure: number; // p0 (mbar)
    allowedDrop: number; // dp (mbar)
    times: Record<number, number>; // diameter (mm) -> time (min)
}

// Standard diameters in the table
const DIAMETERS = [100, 200, 300, 400, 600, 800, 1000];

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

export function getAirTestRequirements(
    method: AirTestMethod,
    material: PipeMaterial,
    diameterMm: number
): { requiredTime: number; allowedDrop: number; testPressure: number } {
    const standard = AIR_TEST_STANDARDS[material][method];

    // Find the closest diameter in the table (rounding up to be safe, or nearest?)
    // Usually standards imply "up to" or specific steps. 
    // If diameter is not exact, we interpolate or take the next largest?
    // For safety, let's take the next largest defined diameter.
    // If larger than max, use max? Or extrapolate?
    // Let's find the first defined diameter >= input diameter.

    let targetDiameter = DIAMETERS.find(d => d >= diameterMm);
    if (!targetDiameter) targetDiameter = 1000; // Cap at 1000 for now or use max logic

    // If diameter is smaller than 100, use 100
    if (diameterMm < 100) targetDiameter = 100;

    const requiredTime = standard.times[targetDiameter];

    return {
        requiredTime,
        allowedDrop: standard.allowedDrop,
        testPressure: standard.pressure
    };
}
