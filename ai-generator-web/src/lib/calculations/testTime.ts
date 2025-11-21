
/**
 * Calculates the required test time for Air Method (EN 1610)
 * Based on pipe diameter and method (LA, LB, LC, LD).
 * 
 * Note: This is a simplified implementation. 
 * In a full implementation, this would look up exact values from EN 1610 Table 3.
 */

export const calculateRequiredTestTime = (
    method: 'LA' | 'LB' | 'LC' | 'LD',
    diameter: number, // in meters
    isShaft: boolean
): number => {
    // Convert diameter to mm for standard tables
    const dn = diameter * 1000;

    let baseTime = 5; // Default 5 minutes

    // Simplified logic based on common EN 1610 values
    // These are approximate and should be verified against the specific standard version used.
    if (method === 'LA') { // 10 mbar
        if (dn <= 100) baseTime = 5;
        else if (dn <= 200) baseTime = 5;
        else if (dn <= 300) baseTime = 7;
        else if (dn <= 400) baseTime = 10;
        else if (dn <= 600) baseTime = 14;
        else baseTime = 5 + (dn - 100) * 0.02; // Rough formula
    } else if (method === 'LB') { // 50 mbar
        if (dn <= 100) baseTime = 4;
        else if (dn <= 200) baseTime = 4;
        else if (dn <= 300) baseTime = 6;
        else if (dn <= 400) baseTime = 8;
        else if (dn <= 600) baseTime = 11;
        else baseTime = 4 + (dn - 100) * 0.015;
    } else if (method === 'LC') { // 100 mbar
        if (dn <= 100) baseTime = 3;
        else if (dn <= 200) baseTime = 3;
        else if (dn <= 300) baseTime = 4;
        else if (dn <= 400) baseTime = 6;
        else if (dn <= 600) baseTime = 8;
        else baseTime = 3 + (dn - 100) * 0.01;
    } else if (method === 'LD') { // 200 mbar
        if (dn <= 100) baseTime = 1.5;
        else if (dn <= 200) baseTime = 1.5;
        else if (dn <= 300) baseTime = 2;
        else if (dn <= 400) baseTime = 3;
        else if (dn <= 600) baseTime = 4;
        else baseTime = 1.5 + (dn - 100) * 0.005;
    }

    // For shafts, test time is typically half of the pipe time (Clause 13.2)
    if (isShaft) {
        return Math.max(baseTime / 2, 1); // Minimum 1 minute
    }

    return Math.ceil(baseTime);
};

export const formatTime = (minutes: number): string => {
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
