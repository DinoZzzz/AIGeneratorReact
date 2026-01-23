import React from 'react';
import { ArrowRight, Copy } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import type { ReportForm, ReportDraft, MaterialType, Material } from '../../../types';

interface ParametersStepProps {
    formData: Partial<ReportForm>;
    drafts: ReportDraft[];
    materialTypes: MaterialType[];
    materials: Material[];
    dionicaError: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onNext: () => void;
    t: (key: string) => string;
    previousReport?: ReportForm | null;
    onCopyFromPrevious?: () => void;
    isNew?: boolean;
}

export const ParametersStep = ({
    formData,
    drafts,
    materialTypes,
    materials,
    dionicaError,
    onChange,
    onNext,
    t,
    previousReport,
    onCopyFromPrevious,
    isNew
}: ParametersStepProps) => {
    const isShaftRound = formData.material_type_id === 1;
    const isShaftRectangular = formData.material_type_id === 2;
    const showPipeFields = [2, 3, 5].includes(formData.draft_id || 0);
    const showGullyFields = [4, 5].includes(formData.draft_id || 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* General Info Card */}
                <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.generalInfo')}</h3>
                    <div className="space-y-4">
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
                        <Input
                            label={t('reports.form.dionicaLabel')}
                            type="text"
                            name="dionica"
                            value={formData.dionica}
                            onChange={onChange}
                            placeholder={t('reports.form.dionicaPlaceholder')}
                        />
                        {dionicaError && <p className="mt-1 text-sm text-destructive">{dionicaError}</p>}
                        <Select
                            label={t('reports.form.schemeLabel')}
                            name="draft_id"
                            value={formData.draft_id}
                            onChange={onChange}
                        >
                            {drafts.length === 0 && (
                                <>
                                    <option value={1}>{t('reports.form.schemeA')}</option>
                                    <option value={3}>{t('reports.form.schemeB')}</option>
                                    <option value={2}>{t('reports.form.schemeC')}</option>
                                    <option value={4}>{t('reports.form.schemeD')}</option>
                                    <option value={5}>{t('reports.form.schemeE')}</option>
                                </>
                            )}
                            {drafts.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </Select>
                        <Select
                            label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyType') : t('reports.form.shaftType')}
                            name="material_type_id"
                            value={formData.material_type_id}
                            onChange={onChange}
                        >
                            {materialTypes.length === 0 && (
                                <>
                                    <option value={1}>{t('reports.form.round')}</option>
                                    <option value={2}>{t('reports.form.rectangular')}</option>
                                </>
                            )}
                            {materialTypes.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </Select>
                        <Select
                            label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyMaterial') : t('reports.form.shaftMaterial')}
                            name="pane_material_id"
                            value={formData.pane_material_id || (isShaftRound ? 1 : 6)}
                            onChange={onChange}
                        >
                            {materials.length > 0 ? (
                                materials.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))
                            ) : (
                                <option value={1}>{t('reports.form.standardMaterial')}</option>
                            )}
                        </Select>
                    </div>
                </div>

                {/* Dimensions Card */}
                <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.dimensions')}</h3>
                    <div className="space-y-4">
                        {isShaftRound && (
                            <Input
                                label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyDiameter') : t('reports.form.paneDiameterMm')}
                                type="number"
                                step="1"
                                name="pane_diameter"
                                value={formData.pane_diameter}
                                onChange={onChange}
                            />
                        )}
                        {isShaftRectangular && formData.draft_id !== 2 && (
                            <>
                                <Input
                                    label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyWidth') : t('reports.form.paneWidthCm')}
                                    type="number"
                                    step="0.01"
                                    name="pane_width"
                                    value={formData.pane_width}
                                    onChange={onChange}
                                />
                                <Input
                                    label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyLength') : t('reports.form.paneLengthCm')}
                                    type="number"
                                    step="0.01"
                                    name="pane_length"
                                    value={formData.pane_length}
                                    onChange={onChange}
                                />
                                <Input
                                    label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyHeight') : t('reports.form.shaftHeight')}
                                    type="number"
                                    step="0.01"
                                    name="pane_height"
                                    value={formData.pane_height}
                                    onChange={onChange}
                                />
                            </>
                        )}

                        {formData.draft_id === 2 && isShaftRound && (
                            <Input
                                label={t('reports.form.mainPipeDiameter')}
                                type="number"
                                step="1"
                                name="pane_diameter"
                                value={formData.pane_diameter}
                                onChange={onChange}
                            />
                        )}

                        {formData.draft_id === 2 && isShaftRectangular && (
                            <>
                                <Input
                                    label={t('reports.form.channelWidth')}
                                    type="number"
                                    step="0.01"
                                    name="pane_width"
                                    value={formData.pane_width}
                                    onChange={onChange}
                                />
                                <Input
                                    label={t('reports.form.channelLength')}
                                    type="number"
                                    step="0.01"
                                    name="pane_length"
                                    value={formData.pane_length}
                                    onChange={onChange}
                                />
                                <Input
                                    label={t('reports.form.channelHeight')}
                                    type="number"
                                    step="0.01"
                                    name="pane_height"
                                    value={formData.pane_height}
                                    onChange={onChange}
                                />
                            </>
                        )}

                        {isShaftRound && (
                            <Input
                                label={t('reports.form.roHeight')}
                                type="number"
                                step="0.01"
                                name="ro_height"
                                value={formData.ro_height}
                                onChange={onChange}
                            />
                        )}

                        <Input
                            label={t('reports.form.waterHeight')}
                            type="number"
                            step="0.01"
                            name="water_height"
                            value={formData.water_height}
                            onChange={onChange}
                        />
                        <div>
                            <label htmlFor="examination_duration" className="text-sm font-medium mb-1 block">{t('reports.form.duration')}</label>
                            <input
                                id="examination_duration"
                                type="text"
                                name="examination_duration"
                                value={formData.examination_duration || '00:30:00'}
                                onChange={onChange}
                                placeholder="00:30:00"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                        <div>
                            <label htmlFor="saturation_time" className="text-sm font-medium mb-1 block">{t('reports.form.saturationTime')}</label>
                            <input
                                id="saturation_time"
                                type="text"
                                name="saturation_time"
                                value={formData.saturation_time || '01:00:00'}
                                onChange={onChange}
                                placeholder="01:00:00"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                        {showPipeFields && (
                            <>
                                <Select
                                    label={t('reports.form.pipeMaterial')}
                                    name="pipe_material_id"
                                    value={formData.pipe_material_id || 1}
                                    onChange={onChange}
                                >
                                    {materials.length > 0 ? (
                                        materials.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))
                                    ) : (
                                        <option value={1}>{t('reports.form.standardPipe')}</option>
                                    )}
                                </Select>
                                <Input
                                    label={t('reports.form.pipeDiameterMm')}
                                    type="number"
                                    step="1"
                                    name="pipe_diameter"
                                    value={formData.pipe_diameter}
                                    onChange={onChange}
                                />
                                <Input
                                    label={t('reports.form.pipeLengthMeters')}
                                    type="number"
                                    step="0.01"
                                    name="pipe_length"
                                    value={formData.pipe_length}
                                    onChange={onChange}
                                />
                                <Input
                                    label={t('reports.form.slope')}
                                    type="number"
                                    step="0.01"
                                    name="pipeline_slope"
                                    value={formData.pipeline_slope}
                                    onChange={onChange}
                                />
                            </>
                        )}
                        {showGullyFields && formData.draft_id !== 4 && (
                            <Input
                                label={t('reports.form.depositionalHeight')}
                                type="number"
                                step="0.01"
                                name="depositional_height"
                                value={formData.depositional_height}
                                onChange={onChange}
                            />
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
