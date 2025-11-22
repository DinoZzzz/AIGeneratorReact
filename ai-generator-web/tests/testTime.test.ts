import { describe, it, expect } from 'vitest';
import { calculateRequiredTestTime, formatTime } from '../src/lib/calculations/testTime';

describe('Test Time Calculations', () => {
    describe('calculateRequiredTestTime', () => {
        it('should calculate correct time for method LA (10 mbar)', () => {
            expect(calculateRequiredTestTime('LA', 0.1, false)).toBe(5); // <= 100mm
            expect(calculateRequiredTestTime('LA', 0.6, false)).toBe(14); // <= 600mm
            expect(calculateRequiredTestTime('LA', 0.8, false)).toBe(19); // > 600mm: 5 + (800-100)*0.02 = 19
        });

        it('should calculate correct time for method LB (50 mbar)', () => {
             expect(calculateRequiredTestTime('LB', 0.1, false)).toBe(4);
             expect(calculateRequiredTestTime('LB', 0.6, false)).toBe(11);
             expect(calculateRequiredTestTime('LB', 0.8, false)).toBe(15); // 4 + (800-100)*0.015 = 14.5 -> 15
        });

        it('should calculate correct time for method LC (100 mbar)', () => {
            expect(calculateRequiredTestTime('LC', 0.1, false)).toBe(3);
            expect(calculateRequiredTestTime('LC', 0.6, false)).toBe(8);
            expect(calculateRequiredTestTime('LC', 0.8, false)).toBe(10); // 3 + (800-100)*0.01 = 10
        });

         it('should calculate correct time for method LD (200 mbar)', () => {
            expect(calculateRequiredTestTime('LD', 0.1, false)).toBe(2); // Math.ceil(1.5) = 2
            expect(calculateRequiredTestTime('LD', 0.6, false)).toBe(4);
            expect(calculateRequiredTestTime('LD', 0.8, false)).toBe(5); // 1.5 + (800-100)*0.005 = 5
        });

        it('should reduce time for shafts', () => {
            // Base for LA 100mm is 5. Half is 2.5. Max(2.5, 1) = 2.5. Ceil(2.5) = 3? Wait, function returns Max(base/2, 1).
            // The function returns `Math.max(baseTime / 2, 1)` directly for shafts, without Math.ceil if it hits that branch?
            // Looking at the code:
            // if (isShaft) { return Math.max(baseTime / 2, 1); }
            // return Math.ceil(baseTime);
            // So for shaft it returns float?
            // Let's check if baseTime is integer.
            // In LA <= 100, baseTime is 5. 5/2 = 2.5.

            const time = calculateRequiredTestTime('LA', 0.1, true);
            expect(time).toBe(2.5);
        });
    });

    describe('formatTime', () => {
        it('should format integer minutes correctly', () => {
            expect(formatTime(5)).toBe('05:00');
        });

        it('should format minutes with seconds correctly', () => {
            expect(formatTime(2.5)).toBe('02:30');
            expect(formatTime(0.1)).toBe('00:06');
        });

        it('should handle zero', () => {
            expect(formatTime(0)).toBe('00:00');
        });
    });
});
