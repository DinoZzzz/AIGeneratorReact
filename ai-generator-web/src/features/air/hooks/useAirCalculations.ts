import { useMemo } from 'react';
import {
    calculateAirReport,
    getAirTestRequirements,
    getMethodFromProcedureId,
    getProcedureIdFromPressure,
    type PipeMaterial,
    type AirReportCalculations
} from '../calculations';
import type { ReportForm, ExaminationProcedure, Material } from '../../../types';

export interface CalculatedAirResults extends AirReportCalculations {}

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

        // Diameter logic: Always use shaft diameter (pane_diameter) for test time
        // Schema A (Draft 1): Shaft only - halve the time
        // Schema B (Draft 2/3): Shaft + Pipeline - full time
        const diameterMm = formData.pane_diameter || 0;

        let procedureId = 1;
        if (selectedProcedure) {
            procedureId = selectedProcedure.id;
        } else {
            procedureId = getProcedureIdFromPressure(formData.pressure_start || 0);
        }

        const selectedMaterial = materials.find(m => m.id === formData.pipe_material_id);
        const isConcrete = selectedMaterial
            ? (selectedMaterial.name.toLowerCase().includes('beton') || selectedMaterial.name.toLowerCase().includes('concrete'))
            : true; // Default to concrete if not selected

        const method = getMethodFromProcedureId(procedureId);
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
    }, [
        formData.examination_procedure_id,
        formData.pane_diameter,
        formData.pressure_start,
        formData.pressure_end,
        formData.pipe_material_id,
        formData.draft_id,
        procedures,
        materials
    ]);
};
