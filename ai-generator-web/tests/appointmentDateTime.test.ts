import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatLocalDateTime } from '../src/components/calendar/appointmentDateTime';

afterEach(() => vi.unstubAllEnvs());

describe('appointment local time', () => {
    it.each([
        ['2026-07-03T08:30:00.000Z', '2026-07-03T10:30'],
        ['2026-01-03T08:30:00.000Z', '2026-01-03T09:30'],
        ['2026-07-03T22:30:00.000Z', '2026-07-04T00:30'],
    ])('preserves %s when an unchanged appointment is saved', (stored, expected) => {
        vi.stubEnv('TZ', 'Europe/Zagreb');
        const input = formatLocalDateTime(stored);
        expect(input).toBe(expected);
        expect(new Date(input).toISOString()).toBe(stored);
    });

    it('preserves a selected calendar slot west of UTC', () => {
        vi.stubEnv('TZ', 'America/New_York');
        const selectedSlot = new Date(2026, 6, 3, 10, 30);
        expect(formatLocalDateTime(selectedSlot)).toBe('2026-07-03T10:30');
        expect(new Date(formatLocalDateTime(selectedSlot)).getTime()).toBe(selectedSlot.getTime());
    });
});
