import { describe, it, expect } from 'vitest';
import {
    calculateWaterLoss,
    calculateWaterVolumeLoss,
    calculateWettedShaftSurface,
    calculateWettedPipeSurface,
    calculateResult,
    isSatisfying
} from './report';

describe('Report Calculations', () => {
    describe('calculateWaterLoss', () => {
        it('should calculate absolute difference', () => {
            expect(calculateWaterLoss(10, 5)).toBe(5);
            expect(calculateWaterLoss(5, 10)).toBe(5);
        });
    });

    describe('calculateWaterVolumeLoss', () => {
        it('should calculate for Round Shaft (Type 1)', () => {
            // loss * diameter^2 * PI / 4
            // 1 * 2^2 * PI / 4 = PI
            expect(calculateWaterVolumeLoss(1, 1, 2)).toBeCloseTo(Math.PI);
        });

        it('should calculate for Rectangular Shaft (Type 2)', () => {
            // loss * width * length
            // 1 * 2 * 3 = 6
            expect(calculateWaterVolumeLoss(1, 2, 0, 2, 3)).toBe(6);
        });
    });

    describe('calculateWettedShaftSurface', () => {
        it('should return 0 if draftId is 6', () => {
            expect(calculateWettedShaftSurface(6, 1, 10)).toBe(0);
        });

        it('should calculate for Round Shaft (Type 1)', () => {
            // (d^2 * PI / 4) + (d * PI * h)
            // d=2, h=1
            // (4 * PI / 4) + (2 * PI * 1) = PI + 2PI = 3PI
            expect(calculateWettedShaftSurface(1, 1, 1, 2)).toBeCloseTo(3 * Math.PI);
        });

        it('should calculate for Rectangular Shaft (Type 2)', () => {
            // (l * w) + 2(l * h) + 2(w * h)
            // l=3, w=2, h=1
            // (3*2) + 2(3*1) + 2(2*1) = 6 + 6 + 4 = 16
            expect(calculateWettedShaftSurface(1, 2, 1, 0, 2, 3)).toBe(16);
        });
    });

    describe('calculateWettedPipeSurface', () => {
        it('should return 0 for draftId 1 or 4', () => {
            expect(calculateWettedPipeSurface(1, 1, 1)).toBe(0);
            expect(calculateWettedPipeSurface(4, 1, 1)).toBe(0);
        });

        it('should calculate for other drafts', () => {
            // (d^2 * PI / 4) + (d * PI * l)
            // d=2, l=1
            // (4 * PI / 4) + (2 * PI * 1) = PI + 2PI = 3PI
            // Note: The function rounds the first part to 2 decimals
            const part1 = Math.round(2 * 2 * Math.PI / 4 * 100) / 100; // 3.14
            const part2 = 2 * Math.PI * 1; // 6.28...
            expect(calculateWettedPipeSurface(2, 2, 1)).toBeCloseTo(part1 + part2);
        });
    });

    describe('calculateResult', () => {
        it('should calculate volume / area', () => {
            expect(calculateResult(10, 2)).toBe(5);
        });

        it('should return 0 if area is 0', () => {
            expect(calculateResult(10, 0)).toBe(0);
        });
    });

    describe('isSatisfying', () => {
        it('should return true if result <= criteria for Water (Type 1)', () => {
            expect(isSatisfying(0.1, 0.2, 1)).toBe(true);
        });

        it('should return false if result > criteria for Water (Type 1)', () => {
            expect(isSatisfying(0.3, 0.2, 1)).toBe(false);
        });
    });
});
