import type { ReportForm } from '../../../types';
import { calculateHydrostaticHeight } from './waterCalculations';

export const WATER_DEVIATION_OPTION_LOW_H2 = 'h2 < 100 cm';
export const WATER_DEVIATION_OPTION_SOME_SECTIONS = 'Kod pojedinih dionica h2 < 100 cm';

/** Keep explicitly selected export metadata, including historical custom text. */
export const normalizeWaterDeviationChoice = (value?: string): string => {
    const compact = (value || '').replace(/\s/g, '').toLowerCase();
    if (compact === 'h2<100cm') return WATER_DEVIATION_OPTION_LOW_H2;
    if (compact === 'kodpojedinihdionicah2<100cm') return WATER_DEVIATION_OPTION_SOME_SECTIONS;
    return value || '';
};

/** Report/UI dimensions are stored as water height in cm and pipe diameter in mm. */
export const getWaterDeviationSuggestion = (report: Partial<ReportForm>): string => {
    if (report.type_id !== undefined && report.type_id !== 1) return '';
    if (report.draft_id !== 2 && report.draft_id !== 3) return '';

    const { water_height: waterHeight, pipe_diameter: pipeDiameter } = report;
    // An unfinished form must not acquire a deviation from empty inputs treated as zero.
    if (typeof waterHeight !== 'number' || !Number.isFinite(waterHeight) || waterHeight <= 0 ||
        typeof pipeDiameter !== 'number' || !Number.isFinite(pipeDiameter) || pipeDiameter <= 0) {
        return '';
    }

    const height = calculateHydrostaticHeight(report.draft_id, waterHeight / 100, pipeDiameter / 1000);
    // Treat arithmetic round-off at exactly 1 m as the boundary, not a deviation.
    if (height >= 1 || Math.abs(height - 1) <= Number.EPSILON * 4) return '';

    return report.draft_id === 2
        ? WATER_DEVIATION_OPTION_SOME_SECTIONS
        : WATER_DEVIATION_OPTION_LOW_H2;
};

/**
 * Refresh known automatic text against the current dimensions, including saved records.
 * Custom notes and intentionally blank saved deviations are preserved. The form can opt
 * into suggesting a value for an empty field before the user has edited it.
 */
export const resolveWaterDeviation = (
    report: Partial<ReportForm>,
    suggestWhenEmpty = false
): string => {
    const existing = report.deviation || '';
    if (report.type_id !== undefined && report.type_id !== 1) return existing;

    const normalized = normalizeWaterDeviationChoice(existing);
    const isAutomatic = normalized === WATER_DEVIATION_OPTION_LOW_H2 ||
        normalized === WATER_DEVIATION_OPTION_SOME_SECTIONS;
    if (isAutomatic) {
        // Keep the chosen wording while the condition remains true.
        return getWaterDeviationSuggestion(report) ? normalized : '';
    }
    if (suggestWhenEmpty && !existing.trim()) {
        return getWaterDeviationSuggestion(report);
    }
    return existing;
};
