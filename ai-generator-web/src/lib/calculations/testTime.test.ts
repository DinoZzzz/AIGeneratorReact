import { describe, it, expect } from 'vitest';
import { calculateRequiredTestTime } from './testTime';

describe('Test Time Calculation (Air Method)', () => {
    // Standard Diameters: [100, 200, 300, 400, 600, 800, 1000, 1100, 1200]

    // Method LA (1): [5, 5, 7, 10, 14, 19, 24, 27, 29]
    // Note: We use Draft ID 2 (Pipe) for standard times.
    // Draft ID 1 is Shaft (Halved).

    it('calculates correct times for Method LA (Proc 1) - Pipe', () => {
        // Exact match (Start of list)
        expect(calculateRequiredTestTime(1, 2, 100)).toBe(5);
        // Exact match (Middle)
        expect(calculateRequiredTestTime(1, 2, 400)).toBe(10);
        // Exact match (Max)
        expect(calculateRequiredTestTime(1, 2, 1200)).toBe(29);
        // Over Max
        expect(calculateRequiredTestTime(1, 2, 1500)).toBe(29);

        // Interpolation: 250mm (between 200[5] and 300[7])
        // 5 + (7-5)*(250-200)/(300-200) = 5 + 2*50/100 = 6
        expect(calculateRequiredTestTime(1, 2, 250)).toBe(6);

        // Interpolation: 500mm (between 400[10] and 600[14])
        // 10 + (14-10)*(500-400)/(600-400) = 10 + 4*100/200 = 12
        expect(calculateRequiredTestTime(1, 2, 500)).toBe(12);
    });

    // Method LB (2): [4, 4, 6, 7, 11, 15, 19, 21, 22]
    it('calculates correct times for Method LB (Proc 2) - Pipe', () => {
         expect(calculateRequiredTestTime(2, 2, 300)).toBe(6);

         // Interpolation: 350mm (between 300[6] and 400[7]) -> 6.5
         expect(calculateRequiredTestTime(2, 2, 350)).toBe(6.5);
    });

    // Shaft Logic (DraftId 1 or 4)
    it('halves the time for Shaft (Draft 1 or 4)', () => {
        // Method LA, 400mm -> 10 mins normal -> 5 mins shaft
        // Draft 4 (Database Shaft)
        expect(calculateRequiredTestTime(1, 4, 400)).toBe(5);

        // Draft 1 (UI Shaft)
        expect(calculateRequiredTestTime(1, 1, 400)).toBe(5);

        // Method LA, 500mm -> 12 mins normal -> 6 mins shaft
        expect(calculateRequiredTestTime(1, 4, 500)).toBe(6);
    });
});
