import { describe, expect, it } from 'vitest';
import type { ExaminationProcedure, Material } from '../../../types';
import { withCurrentReportLookups } from './currentReportLookups';

const oldMaterial: Material = { id: 1, name: 'Beton', material_type_id: 1 };
const selectedMaterial: Material = { id: 7, name: 'PVC', material_type_id: 2 };
const oldProcedure: ExaminationProcedure = { id: 1, name: 'LA', allowed_loss: 2.5 };
const selectedProcedure: ExaminationProcedure = { id: 12, name: 'LB', allowed_loss: 10 };

describe('current report export lookups', () => {
    it('uses the selected air method name even when lookup IDs differ from legacy method order', () => {
        const report = withCurrentReportLookups({
            examination_procedure_id: selectedProcedure.id,
            examination_procedure: oldProcedure,
        }, [], [oldProcedure, selectedProcedure]);

        expect(report.examination_procedure?.name).toBe('LB');
        expect(report.examination_procedure_id).toBe(12);
    });

    it('replaces old material joins after changing either selection', () => {
        const report = withCurrentReportLookups({
            pane_material_id: selectedMaterial.id,
            pipe_material_id: selectedMaterial.id,
            pane_material: oldMaterial,
            pipe_material: oldMaterial,
        }, [oldMaterial, selectedMaterial]);

        expect(report.pane_material).toBe(selectedMaterial);
        expect(report.pipe_material).toBe(selectedMaterial);
    });

    it('never falls back to labels belonging to a different selected ID', () => {
        const report = withCurrentReportLookups({
            pane_material_id: 99,
            pipe_material_id: 99,
            examination_procedure_id: 99,
            pane_material: oldMaterial,
            pipe_material: oldMaterial,
            examination_procedure: oldProcedure,
        }, []);

        expect(report.pane_material).toBeUndefined();
        expect(report.pipe_material).toBeUndefined();
        expect(report.examination_procedure).toBeUndefined();
    });

    it('retains a matching saved join if the lookup is temporarily unavailable', () => {
        const report = withCurrentReportLookups({
            pipe_material_id: selectedMaterial.id,
            pipe_material: selectedMaterial,
            examination_procedure_id: selectedProcedure.id,
            examination_procedure: selectedProcedure,
        }, []);

        expect(report.pipe_material).toBe(selectedMaterial);
        expect(report.examination_procedure).toBe(selectedProcedure);
    });
});
