import { useMemo } from 'react';
import {
    calculateAirReport,
    getAirTestRequirements,
    getMethodFromProcedureName,
    type PipeMaterial,
    type AirReportCalculations,
    type AirTestMethod
} from '../calculations';
import type { ReportForm, ExaminationProcedure, Material } from '../../../types';

export type CalculatedAirResults = AirReportCalculations;

interface UseAirCalculationsParams {
    formData: Partial<ReportForm>;
    procedures: ExaminationProcedure[];
    materials: Material[];
}

/**
 * Hook to calculate air method report results.
 * Memoizes calculations to prevent recalculation on every render.
 */
export const useAirCalculations = ({
    formData,
    procedures,
    materials
}: UseAirCalculationsParams): CalculatedAirResults => {
    return useMemo<CalculatedAirResults>(() => {
        const selectedProcedure = procedures.find(p => p.id === formData.examination_procedure_id);

        // Pipe tests use the pipe diameter; shaft-only tests use the shaft diameter.
        const usesPipeDiameter = formData.draft_id === 2 || formData.draft_id === 3;
        const diameterMm = usesPipeDiameter
            ? (formData.pipe_diameter || formData.pane_diameter || 0)
            : (formData.pane_diameter || formData.pipe_diameter || 0);

        // Get method from procedure name (more reliable than ID-based mapping)
        let method: AirTestMethod = 'LA';
        if (selectedProcedure?.name) {
            method = getMethodFromProcedureName(selectedProcedure.name);
        } else {
            // Fallback: determine method from pressure if no procedure selected
            const pressure = formData.pressure_start || 0;
            if (pressure >= 200) method = 'LD';
            else if (pressure >= 100) method = 'LC';
            else if (pressure >= 50) method = 'LB';
        }

        const selectedMaterial = materials.find(m => m.id === formData.pipe_material_id);
        const isConcrete = selectedMaterial
            ? (selectedMaterial.name.toLowerCase().includes('beton') || selectedMaterial.name.toLowerCase().includes('concrete'))
            : true; // Default to concrete if not selected
        const materialKey: PipeMaterial = isConcrete ? 'CONCRETE' : 'OTHER';

        // Get requirements from table
        const requirements = getAirTestRequirements(method, materialKey, diameterMm);

        // Shaft logic: Halve the time if it's a shaft test (Draft 1)
        let finalTime = requirements.requiredTime;
        if (formData.draft_id === 1) {
            finalTime = finalTime / 2;
        }

        const allowedLoss = requirements.allowedDrop;

        const results = calculateAirReport(formData as ReportForm, allowedLoss);

        return {
            pressureLoss: results.pressureLoss,
            allowedLoss: allowedLoss,
            satisfies: results.satisfies,
            testTime: '00:00',
            requiredTestTime: finalTime
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        formData.examination_procedure_id,
        formData.pane_diameter,
        formData.pipe_diameter,
        formData.pressure_start,
        formData.pressure_end,
        formData.pipe_material_id,
        formData.draft_id,
        procedures,
        materials
     
    ]);
};
