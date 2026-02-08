import { describe, it, expect } from 'vitest';
import {
    computeAnalyticsFromForms,
    parseDurationMinutes,
    type AnalyticsFormRow,
} from '../src/lib/analytics';

describe('analytics utilities', () => {
    it('parses duration in HH:MM:SS format', () => {
        expect(parseDurationMinutes('01:30:00')).toBe(90);
        expect(parseDurationMinutes('00:10:30')).toBe(10.5);
        expect(parseDurationMinutes(null)).toBe(0);
        expect(parseDurationMinutes('invalid')).toBe(0);
    });

    it('computes metrics, trends, and buckets from forms', () => {
        const now = new Date('2026-02-08T12:00:00Z');
        const forms: AnalyticsFormRow[] = [
            {
                satisfies: true,
                type_id: 1,
                examination_duration: '00:10:00',
                created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                satisfies: false,
                type_id: 2,
                examination_duration: '00:45:00',
                created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                satisfies: true,
                type_id: 1,
                examination_duration: '01:15:00',
                created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                satisfies: false,
                type_id: 2,
                examination_duration: null,
                created_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
            },
        ];

        const result = computeAnalyticsFromForms(forms, {
            now,
            totalCustomers: 12,
            totalConstructions: 34,
        });

        expect(result.stats.totalReports).toBe(4);
        expect(result.stats.pass).toBe(2);
        expect(result.stats.fail).toBe(2);
        expect(result.stats.passRate).toBe(50);
        expect(result.stats.failRate).toBe(50);
        expect(result.stats.totalCustomers).toBe(12);
        expect(result.stats.totalConstructions).toBe(34);

        expect(result.stats.waterReports).toBe(2);
        expect(result.stats.airReports).toBe(2);
        expect(result.stats.avgWater).toBe(42.5);
        expect(result.stats.avgAir).toBe(22.5);
        expect(result.stats.avgDuration).toBe(43.3);

        expect(result.stats.recentReports).toBe(2);
        expect(result.stats.previousWeekReports).toBe(1);
        expect(result.stats.weeklyMomentum).toBe(100);
        expect(result.stats.avgDailyReports).toBe(0.3);

        expect(result.dailyTrend).toHaveLength(30);
        expect(result.dailyTrend.reduce((acc, item) => acc + item.total, 0)).toBe(3);
        expect(result.dailyTrend.reduce((acc, item) => acc + item.pass, 0)).toBe(2);
        expect(result.dailyTrend.reduce((acc, item) => acc + item.fail, 0)).toBe(1);

        expect(result.methodMix).toEqual([
            { type: 'water', count: 2, percentage: 50 },
            { type: 'air', count: 2, percentage: 50 },
        ]);

        expect(result.durationBuckets).toEqual([
            { bucket: 'under15', count: 1 },
            { bucket: '15to30', count: 0 },
            { bucket: '30to60', count: 1 },
            { bucket: 'over60', count: 1 },
        ]);

        expect(result.weekdayActivity.reduce((acc, item) => acc + item.total, 0)).toBe(4);
    });

    it('returns safe defaults for empty input', () => {
        const result = computeAnalyticsFromForms([], { now: new Date('2026-02-08T12:00:00Z') });

        expect(result.stats.totalReports).toBe(0);
        expect(result.stats.passRate).toBe(0);
        expect(result.stats.failRate).toBe(0);
        expect(result.stats.weeklyMomentum).toBe(0);
        expect(result.stats.avgDailyReports).toBe(0);
        expect(result.dailyTrend).toHaveLength(30);
        expect(result.methodMix).toEqual([
            { type: 'water', count: 0, percentage: 0 },
            { type: 'air', count: 0, percentage: 0 },
        ]);
    });
});
