import React from 'react';
import { ArrowRight, Copy } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import type { ReportForm, ExaminationProcedure, ReportDraft, MaterialType, Material } from '../../../types';

interface ParametersStepProps {
    formData: Partial<ReportForm>;
    procedures: ExaminationProcedure[];
    drafts: ReportDraft[];
    materialTypes: MaterialType[];
    materials: Material[];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onNext: () => void;
    t: (key: string) => string;
    previousReport?: ReportForm | null;
    onCopyFromPrevious?: () => void;
    isNew?: boolean;
}

export const ParametersStep = ({
    formData,
    procedures,
    drafts,
    materialTypes,
    materials,
    onChange,
    onNext,
    t,
    previousReport,
    onCopyFromPrevious,
    isNew
}: ParametersStepProps) => {
    const isShaftRound = formData.material_type_id === 1;
    const isShaftRectangular = formData.material_type_id === 2;
    // Show pipe fields for Schema B (Draft 2), Schema C (Draft 3), and Schema E (Draft 5)
    // Hide for Schema A (Draft 1) and Schema D (Draft 4)
    const showPipeFields = formData.draft_id === 2 || formData.draft_id === 3 || formData.draft_id === 5;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* General Info Card */}
                <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.generalInfo')}</h3>
                    <div className="space-y-4">
                        <Select
                            label={t('reports.form.examProcedure')}
                            name="examination_procedure_id"
                            value={formData.examination_procedure_id}
                            onChange={onChange}
                        >
                            <option value="">{t('reports.form.selectProcedure')}</option>
                            {procedures.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </Select>
                        <Input
                            label={t('reports.form.dionica')}
                            name="dionica"
                            value={formData.dionica || ''}
                            onChange={onChange}
                            required
                        />
                        <Input
                            label={t('reports.form.examDate')}
                            type="date"
                            name="examination_date"
                            value={formData.examination_date}
                            onChange={onChange}
                        />
                        <Input
                            label={t('reports.form.temperature')}
                            type="number"
                            step="0.1"
                            name="temperature"
                            value={formData.temperature}
                            onChange={onChange}
                        />
                    </div>
                </div>

                {/* Structure Type Card */}
                <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">{t('reports.form.structureType')}</h3>
                        {previousReport && isNew && onCopyFromPrevious && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onCopyFromPrevious}
                                className="text-xs"
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                {t('reports.form.copyFromPrevious')}
                            </Button>
                        )}
                    </div>
                    <div className="space-y-4">
                        <Select
                            label={t('reports.form.draftType')}
                            name="draft_id"
                            value={formData.draft_id}
                            onChange={onChange}
                        >
                            {drafts.length === 0 && <option value={1}>{t('reports.form.shaftOnly')}</option>}
                            {drafts.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </Select>
                        <Select
                            label={t('reports.form.materialType')}
                            name="material_type_id"
                            value={formData.material_type_id}
                            onChange={onChange}
                            disabled={formData.draft_id === 1} // Disable for Shaft Only
                        >
                            {materialTypes.length === 0 && <option value={1}>{t('reports.form.round')}</option>}
                            {materialTypes
                                .filter(m => formData.draft_id === 1 ? m.id === 1 : true) // Only show Round for Shaft
                                .map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                        </Select>
                        <Select
                            label={t('reports.form.pipeMaterial')}
                            name="pipe_material_id"
                            value={formData.pipe_material_id}
                            onChange={onChange}
                        >
                            <option value="">{t('reports.form.selectMaterial')}</option>
                            {materials
                                .filter(m => ['suhe betonske cijevi', 'ostale cijevi'].includes(m.name.toLowerCase()))
                                .map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                        </Select>
                    </div>
                </div>

                {/* Dimensions Card */}
                <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.dimensions')}</h3>
                    <div className="space-y-4">
                        {isShaftRound && (
                            <Input
                                label={t('reports.form.paneDiameterMm')}
                                type="number"
                                name="pane_diameter"
                                value={formData.pane_diameter}
                                onChange={onChange}
                            />
                        )}
                        {isShaftRectangular && (
                            <>
                                <Input
                                    label={t('reports.form.paneWidthM')}
                                    type="number"
                                    step="0.01"
                                    name="pane_width"
                                    value={formData.pane_width}
                                    onChange={onChange}
                                />
                                <Input
                                    label={t('reports.form.paneLengthM')}
                                    type="number"
                                    step="0.01"
                                    name="pane_length"
                                    value={formData.pane_length}
                                    onChange={onChange}
                                />
                            </>
                        )}
                        {showPipeFields && (
                            <>
                                <Input
                                    label={t('reports.form.pipeDiameterMm')}
                                    type="number"
                                    name="pipe_diameter"
                                    value={formData.pipe_diameter}
                                    onChange={onChange}
                                />
                                <Input
                                    label={t('reports.form.pipeLengthM')}
                                    type="number"
                                    step="0.01"
                                    name="pipe_length"
                                    value={formData.pipe_length}
                                    onChange={onChange}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3 flex justify-end">
                <Button type="button" onClick={onNext} size="lg" className="w-full sm:w-auto">
                    {t('reports.form.nextStep')} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
    );
};
