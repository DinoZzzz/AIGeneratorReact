import { describe, it, expect } from 'vitest';
import { calculateRequiredTestTime, formatTime } from '../src/lib/calculations/testTime';

describe('testTime calculations', () => {
  describe('calculateRequiredTestTime', () => {
    it('calculates correct time for method LA', () => {
      // <= 100
      expect(calculateRequiredTestTime('LA', 0.1, false)).toBe(5);
      // <= 200
      expect(calculateRequiredTestTime('LA', 0.2, false)).toBe(5);
      // <= 300
      expect(calculateRequiredTestTime('LA', 0.3, false)).toBe(7);
      // <= 400
      expect(calculateRequiredTestTime('LA', 0.4, false)).toBe(10);
      // <= 600
      expect(calculateRequiredTestTime('LA', 0.6, false)).toBe(14);
      // > 600: 5 + (dn - 100) * 0.02
      // dn = 800 => 5 + 700 * 0.02 = 5 + 14 = 19
      expect(calculateRequiredTestTime('LA', 0.8, false)).toBe(19);
    });

    it('calculates correct time for method LB', () => {
      // <= 100
      expect(calculateRequiredTestTime('LB', 0.1, false)).toBe(4);
      // > 600: 4 + (dn - 100) * 0.015
      // dn = 800 => 4 + 700 * 0.015 = 4 + 10.5 = 14.5 -> ceil(14.5) = 15
      expect(calculateRequiredTestTime('LB', 0.8, false)).toBe(15);
    });

    it('calculates correct time for method LC', () => {
      // <= 100
      expect(calculateRequiredTestTime('LC', 0.1, false)).toBe(3);
      // > 600: 3 + (dn - 100) * 0.01
      // dn = 800 => 3 + 700 * 0.01 = 3 + 7 = 10
      expect(calculateRequiredTestTime('LC', 0.8, false)).toBe(10);
    });

    it('calculates correct time for method LD', () => {
      // <= 100
      expect(calculateRequiredTestTime('LD', 0.1, false)).toBe(2); // Math.ceil(1.5)
      // > 600: 1.5 + (dn - 100) * 0.005
      // dn = 800 => 1.5 + 700 * 0.005 = 1.5 + 3.5 = 5
      expect(calculateRequiredTestTime('LD', 0.8, false)).toBe(5);
    });

    it('calculates correct time for shafts (isShaft = true)', () => {
      // Shaft time is typically half of the pipe time, min 1 minute
      // LA, 0.1 => 5 min. Half is 2.5.
      expect(calculateRequiredTestTime('LA', 0.1, true)).toBe(2.5);

      // Test minimum cap logic?
      // If baseTime is very small...
      // LD <= 100 is 1.5. Half is 0.75. Should be 1.
      expect(calculateRequiredTestTime('LD', 0.1, true)).toBe(1);
    });
  });

  describe('formatTime', () => {
    it('formats integer minutes correctly', () => {
      expect(formatTime(5)).toBe('05:00');
    });

    it('formats minutes with seconds correctly', () => {
      expect(formatTime(5.5)).toBe('05:30');
      expect(formatTime(2.25)).toBe('02:15');
    });

    it('pads single digits correctly', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(0.1)).toBe('00:06'); // 0.1 * 60 = 6
    });
  });
});
