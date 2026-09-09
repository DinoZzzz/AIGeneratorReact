import { describe, expect, it } from 'vitest';
import type { ReportForm } from '../../../types';
import {
    getWaterDeviationSuggestion,
    normalizeWaterDeviationChoice,
    resolveWaterDeviation,
    WATER_DEVIATION_OPTION_LOW_H2,
    WATER_DEVIATION_OPTION_SOME_SECTIONS,
} from './waterDeviations';

const report: Partial<ReportForm> = {
    type_id: 1,
    draft_id: 3,
    water_height: 110, // cm
    pipe_diameter: 200, // mm; hydrostatic height is 90 cm
};

describe('water deviation suggestions', () => {
    it.each([
        [2, 119, WATER_DEVIATION_OPTION_SOME_SECTIONS],
        [3, 119, WATER_DEVIATION_OPTION_LOW_H2],
        [2, 120, ''],
        [3, 120, ''],
        [2, 121, ''],
        [3, 121, ''],
    ])('uses hydrostatic height for draft %s at water height %s cm', (draft_id, water_height, expected) => {
        expect(getWaterDeviationSuggestion({ ...report, draft_id, water_height })).toBe(expected);
    });

    it('does not mistake floating point error at exactly 100 cm for a deviation', () => {
        expect(getWaterDeviationSuggestion({ ...report, water_height: 113, pipe_diameter: 130 })).toBe('');
    });

    it('recognizes low hydrostatic height even when the water level is above 100 cm', () => {
        expect(getWaterDeviationSuggestion(report)).toBe(WATER_DEVIATION_OPTION_LOW_H2);
    });

    it.each([
        {},
        { water_height: 110 },
        { pipe_diameter: 200 },
        { water_height: '' as unknown as number, pipe_diameter: 200 },
        { water_height: 110, pipe_diameter: '' as unknown as number },
        { water_height: 0, pipe_diameter: 200 },
        { water_height: 110, pipe_diameter: 0 },
        { water_height: Number.NaN, pipe_diameter: 200 },
        { water_height: 110, pipe_diameter: Number.POSITIVE_INFINITY },
    ])('leaves incomplete or invalid dimensions without an automatic deviation: %j', (dimensions) => {
        expect(getWaterDeviationSuggestion({ type_id: 1, draft_id: 3, ...dimensions })).toBe('');
    });

    it('does not suggest a water deviation for air tests or other schemas', () => {
        expect(getWaterDeviationSuggestion({ ...report, type_id: 2 })).toBe('');
        expect(getWaterDeviationSuggestion({ ...report, draft_id: 1 })).toBe('');
    });
});

describe('resolving saved and edited report deviations', () => {
    it.each([
        WATER_DEVIATION_OPTION_LOW_H2,
        WATER_DEVIATION_OPTION_SOME_SECTIONS,
        'h2<100cm',
        'Kod pojedinih dionica h2<100cm',
    ])('removes stale saved automatic wording %s when actual hydrostatic height is 137 cm', (deviation) => {
        const saved = { ...report, water_height: 153, pipe_diameter: 160, deviation };
        expect(resolveWaterDeviation(saved)).toBe('');
        expect(saved.deviation).toBe(deviation);
    });

    it('clears a previous auto suggestion when dimensions cross the threshold', () => {
        const withSuggestion = { ...report, deviation: resolveWaterDeviation(report, true) };
        expect(withSuggestion.deviation).toBe(WATER_DEVIATION_OPTION_LOW_H2);
        expect(resolveWaterDeviation({ ...withSuggestion, water_height: 120 }, true)).toBe('');
    });

    it('preserves a valid saved aggregate option', () => {
        expect(resolveWaterDeviation({ ...report, deviation: WATER_DEVIATION_OPTION_SOME_SECTIONS }))
            .toBe(WATER_DEVIATION_OPTION_SOME_SECTIONS);
    });

    it('keeps custom notes, including notes that mention the height threshold', () => {
        const deviation = 'Poseban dogovor: prethodno h2 < 100 cm, zatim ponovljeno ispitivanje.';
        expect(resolveWaterDeviation({ ...report, water_height: 153, deviation }, true)).toBe(deviation);
    });

    it('preserves an intentionally cleared deviation when saving or exporting', () => {
        expect(resolveWaterDeviation({ ...report, deviation: '' })).toBe('');
        expect(resolveWaterDeviation(report)).toBe('');
    });

    it('only fills an empty deviation when the form opts into suggestions', () => {
        expect(resolveWaterDeviation(report, true)).toBe(WATER_DEVIATION_OPTION_LOW_H2);
    });

    it('does not rewrite air report deviations', () => {
        expect(resolveWaterDeviation({ ...report, type_id: 2, deviation: 'h2<100cm' })).toBe('h2<100cm');
    });
});

describe('Word export deviation choices', () => {
    it('defaults missing and explicitly blank values to no deviation', () => {
        expect(normalizeWaterDeviationChoice()).toBe('');
        expect(normalizeWaterDeviationChoice('')).toBe('');
    });

    it('preserves both explicit choices and normalizes old stored spacing', () => {
        expect(normalizeWaterDeviationChoice(WATER_DEVIATION_OPTION_LOW_H2)).toBe(WATER_DEVIATION_OPTION_LOW_H2);
        expect(normalizeWaterDeviationChoice(WATER_DEVIATION_OPTION_SOME_SECTIONS)).toBe(WATER_DEVIATION_OPTION_SOME_SECTIONS);
        expect(normalizeWaterDeviationChoice('Kod pojedinih dionica h2<100cm')).toBe(WATER_DEVIATION_OPTION_SOME_SECTIONS);
    });

    it('preserves saved custom export text instead of substituting a low-height statement', () => {
        expect(normalizeWaterDeviationChoice('Poseban dogovor s naručiteljem')).toBe('Poseban dogovor s naručiteljem');
    });
});
