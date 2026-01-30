import { useMemo } from 'react';
import {
    calculateWaterReport,
    calculateWettedShaftSurface,
    calculateWettedPipeSurface,
    calculateHydrostaticHeight,
    type WaterReportCalculations
} from '../calculations';
import type { ReportForm } from '../../../types';

export type CalculatedWaterResults = WaterReportCalculations;

/**
 * Hook to calculate water method report results.
 * Memoizes calculations to prevent recalculation on every render.
 */
export const useWaterCalculations = (formData: Partial<ReportForm>): CalculatedWaterResults => {
    return useMemo<CalculatedWaterResults>(() => {
        // Convert inputs from mm/cm to meters for calculations
        const formDataInMeters = {
            ...formData,
            pane_diameter: (formData.pane_diameter || 0) / 1000, // mm to m
            pane_width: (formData.pane_width || 0) / 100, // cm to m (for rectangular)
            pane_length: (formData.pane_length || 0) / 100, // cm to m (for rectangular)
            pane_height: (formData.pane_height || 0) / 100, // cm to m
            pipe_diameter: (formData.pipe_diameter || 0) / 1000, // mm to m
            water_height: (formData.water_height || 0) / 100, // cm to m
            depositional_height: (formData.depositional_height || 0) // already in m
        };

        const results = calculateWaterReport(formDataInMeters as ReportForm);

        // Calculate wetted shaft surface separately for display
        const wettedShaftSurface = calculateWettedShaftSurface(
            formData.draft_id || 1,
            formData.material_type_id || 1,
            (formData.water_height || 0) / 100, // cm to m
            (formData.pane_diameter || 0) / 1000, // mm to m
            (formData.pane_width || 0) / 100, // cm to m (for rectangular)
            (formData.pane_length || 0) / 100 // cm to m (for rectangular)
        );

        // Calculate wetted pipe surface separately for display
        let wettedPipeSurface = 0;

        // For Schema C (Pipe Only), calculate based on shaft type
        if (formData.draft_id === 2) {
            if (formData.material_type_id === 1) {
                // Round: Main pipe (covered by wettedShaftSurface) + secondary pipe
                const secondaryPipeDiameter = (formData.pipe_diameter || 0) / 1000; // mm to m
                const secondaryPipeSurface = calculateWettedPipeSurface(
                    formData.draft_id,
                    secondaryPipeDiameter,
                    formData.pipe_length || 0
                );

                wettedPipeSurface = secondaryPipeSurface;
            } else if (formData.material_type_id === 2) {
                // Rectangular: Channel (covered by wettedShaftSurface) + small pipe
                const secondaryPipeDiameter = (formData.pipe_diameter || 0) / 1000; // mm to m
                const secondaryPipeSurface = calculateWettedPipeSurface(
                    formData.draft_id,
                    secondaryPipeDiameter,
                    formData.pipe_length || 0
                );

                wettedPipeSurface = secondaryPipeSurface;
            }
        } else {
            // For other schemes, use single pipe calculation
            wettedPipeSurface = calculateWettedPipeSurface(
                formData.draft_id || 1,
                (formData.pipe_diameter || 0) / 1000, // mm to m
                formData.pipe_length || 0 // already in m
            );
        }

        // Calculate hydrostatic height
        const hydrostaticHeight = calculateHydrostaticHeight(
            formData.draft_id || 1,
            (formData.water_height || 0) / 100, // cm to m
            (formData.pipe_diameter || 0) / 1000, // mm to m
            formData.depositional_height || 0
        );

        return { ...results, wettedShaftSurface, wettedPipeSurface, hydrostaticHeight };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        formData.draft_id,
        formData.material_type_id,
        formData.pane_diameter,
        formData.pane_width,
        formData.pane_length,
        formData.pane_height,
        formData.pipe_diameter,
        formData.pipe_length,
        formData.water_height,
        formData.water_height_start,
        formData.water_height_end,
        formData.depositional_height,
        formData.temperature,
        formData.examination_duration
     
    ]);
};
