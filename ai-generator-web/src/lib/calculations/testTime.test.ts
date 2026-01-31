import { describe, it, expect } from 'vitest';
import { calculateRequiredTestTime } from './testTime';

describe('Test Time Calculation (Air Method)', () => {
    /**
     * Default material is CONCRETE (isConcrete = true)
     *
     * CONCRETE times from AIR_TEST_STANDARDS:
     * - Diameters: [100, 200, 300, 400, 600, 800, 1000]
     * - LA (procedureId=1): { 100: 5, 200: 5, 300: 5, 400: 7, 600: 11, 800: 14, 1000: 18 }
     * - LB (procedureId=2): { 100: 4, 200: 4, 300: 4, 400: 6, 600: 8, 800: 11, 1000: 14 }
     * - LC (procedureId=3): { 100: 3, 200: 3, 300: 3, 400: 4, 600: 6, 800: 8, 1000: 10 }
     * - LD (procedureId=4): { 100: 1.5, 200: 1.5, 300: 1.5, 400: 2, 600: 3, 800: 4, 1000: 5 }
     *
     * DraftId: 1 or 4 = Shaft (halves the time), 2 = Pipe (normal time)
     */

    describe('Method LA (procedureId=1) - Pipe', () => {
        it('returns exact time for matching diameter', () => {
            expect(calculateRequiredTestTime(1, 2, 100)).toBe(5);
            expect(calculateRequiredTestTime(1, 2, 400)).toBe(7);
            expect(calculateRequiredTestTime(1, 2, 1000)).toBe(18);
        });

        it('returns max time for diameter above 1000mm', () => {
            expect(calculateRequiredTestTime(1, 2, 1200)).toBe(18);
            expect(calculateRequiredTestTime(1, 2, 1500)).toBe(18);
        });

        it('interpolates between diameters', () => {
            // 250mm between 200[5] and 300[5] -> 5 (same values)
            expect(calculateRequiredTestTime(1, 2, 250)).toBe(5);

            // 500mm between 400[7] and 600[11]
            // 7 + (11-7)*(500-400)/(600-400) = 7 + 4*0.5 = 9
            expect(calculateRequiredTestTime(1, 2, 500)).toBe(9);

            // 700mm between 600[11] and 800[14]
            // 11 + (14-11)*(700-600)/(800-600) = 11 + 3*0.5 = 12.5
            expect(calculateRequiredTestTime(1, 2, 700)).toBe(12.5);
        });
    });

    describe('Method LB (procedureId=2) - Pipe', () => {
        it('returns exact time for matching diameter', () => {
            expect(calculateRequiredTestTime(2, 2, 100)).toBe(4);
            expect(calculateRequiredTestTime(2, 2, 300)).toBe(4);
            expect(calculateRequiredTestTime(2, 2, 400)).toBe(6);
        });

        it('interpolates between diameters', () => {
            // 350mm between 300[4] and 400[6]
            // 4 + (6-4)*(350-300)/(400-300) = 4 + 2*0.5 = 5
            expect(calculateRequiredTestTime(2, 2, 350)).toBe(5);

            // 500mm between 400[6] and 600[8]
            // 6 + (8-6)*(500-400)/(600-400) = 6 + 2*0.5 = 7
            expect(calculateRequiredTestTime(2, 2, 500)).toBe(7);
        });
    });

    describe('Shaft (draftId=1 or 4) - halves the time', () => {
        it('halves time for draftId=4 (Database Shaft)', () => {
            // LA at 400mm = 7 -> 3.5
            expect(calculateRequiredTestTime(1, 4, 400)).toBe(3.5);

            // LA at 1000mm = 18 -> 9
            expect(calculateRequiredTestTime(1, 4, 1000)).toBe(9);
        });

        it('halves time for draftId=1 (UI Shaft)', () => {
            // LA at 400mm = 7 -> 3.5
            expect(calculateRequiredTestTime(1, 1, 400)).toBe(3.5);
        });

        it('halves interpolated time correctly', () => {
            // LA at 500mm = 9 -> 4.5
            expect(calculateRequiredTestTime(1, 4, 500)).toBe(4.5);

            // LB at 350mm = 5 -> 2.5
            expect(calculateRequiredTestTime(2, 1, 350)).toBe(2.5);
        });
    });

    describe('Method LC and LD', () => {
        it('calculates LC times correctly', () => {
            expect(calculateRequiredTestTime(3, 2, 400)).toBe(4);
            expect(calculateRequiredTestTime(3, 2, 1000)).toBe(10);
        });

        it('calculates LD times correctly', () => {
            expect(calculateRequiredTestTime(4, 2, 400)).toBe(2);
            expect(calculateRequiredTestTime(4, 2, 1000)).toBe(5);
        });
    });
});
