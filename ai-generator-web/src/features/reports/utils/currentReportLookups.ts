import type { ExaminationProcedure, Material, ReportForm } from '../../../types';

/** Resolve export labels from the current selection, not an earlier joined row. */
export const withCurrentReportLookups = (
    report: Partial<ReportForm>,
    materials: Material[],
    procedures: ExaminationProcedure[] = [],
): Partial<ReportForm> => ({
    ...report,
    pane_material: materials.find((material) => material.id === report.pane_material_id)
        ?? (report.pane_material?.id === report.pane_material_id ? report.pane_material : undefined),
    pipe_material: materials.find((material) => material.id === report.pipe_material_id)
        ?? (report.pipe_material?.id === report.pipe_material_id ? report.pipe_material : undefined),
    examination_procedure: procedures.find((procedure) => procedure.id === report.examination_procedure_id)
        ?? (report.examination_procedure?.id === report.examination_procedure_id ? report.examination_procedure : undefined),
});
