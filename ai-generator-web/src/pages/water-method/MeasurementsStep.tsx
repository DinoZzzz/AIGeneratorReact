import React from 'react';
import { ChevronLeft, Save } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import type { ReportForm } from '../../types';
import type { CalculatedResults } from './useWaterCalculations';

interface MeasurementsStepProps {
    formData: Partial<ReportForm>;
    calculated: CalculatedResults;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onPrevious: () => void;
    t: (key: string) => string;
}

export const MeasurementsStep = ({
    formData,
    calculated,
    onChange,
    onPrevious,
    t
}: MeasurementsStepProps) => {
    const showPipeFields = [2, 3, 5].includes(formData.draft_id || 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Measurements Card */}
                <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.measurementsSection')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label={t('reports.form.startWaterLevel')}
                            type="number"
                            step="0.01"
                            name="water_height_start"
                            value={formData.water_height_start}
                            onChange={onChange}
                        />
                        <Input
                            label={t('reports.form.endWaterLevel')}
                            type="number"
                            step="0.01"
                            name="water_height_end"
                            value={formData.water_height_end}
                            onChange={onChange}
                        />
                    </div>
                </div>

                {/* Notes Card */}
                <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.notesSection')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="remark" className="text-sm font-medium mb-1 block">{t('reports.form.remarkLabel')}</label>
                            <textarea
                                id="remark"
                                name="remark"
                                value={formData.remark || ''}
                                onChange={onChange}
                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder={t('reports.form.remarkPlaceholder')}
                            />
                        </div>
                        <div>
                            <label htmlFor="deviation" className="text-sm font-medium mb-1 block">{t('reports.form.deviationLabel')}</label>
                            <textarea
                                id="deviation"
                                name="deviation"
                                value={formData.deviation || ''}
                                onChange={onChange}
                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder={t('reports.form.deviationPlaceholder')}
                            />
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-4">
                    <Button type="button" variant="outline" onClick={onPrevious} size="lg" className="w-full sm:w-auto">
                        <ChevronLeft className="mr-2 h-5 w-5" /> {t('reports.form.prevStep')}
                    </Button>
                    <Button type="submit" size="lg" className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        {t('reports.form.saveReport')}
                    </Button>
                </div>
            </div>

            {/* Results Panel - Desktop Only */}
            <div className="hidden lg:block lg:col-span-1">
                <ResultsPanel calculated={calculated} showPipeFields={showPipeFields} formData={formData} t={t} />
            </div>
        </div>
    );
};

interface ResultsPanelProps {
    calculated: CalculatedResults;
    showPipeFields: boolean;
    formData: Partial<ReportForm>;
    t: (key: string) => string;
}

export const ResultsPanel = ({ calculated, showPipeFields, formData, t }: ResultsPanelProps) => (
    <div className="bg-card shadow-sm rounded-xl border border-border p-6 sticky top-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">{t('reports.form.calculatedResults')}</h3>

        <div className="space-y-6">
            {/* Status Badge */}
            <div className={cn(
                "p-4 rounded-lg border flex flex-col items-center justify-center text-center",
                calculated.satisfies
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50"
                    : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50"
            )}>
                <span className={cn(
                    "text-sm font-medium uppercase tracking-wider mb-1",
                    calculated.satisfies ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>{t('reports.form.status')}</span>
                <span className={cn(
                    "text-2xl font-bold",
                    calculated.satisfies ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                )}>
                    {calculated.satisfies ? t('reports.form.satisfies') : t('reports.form.failed')}
                </span>
            </div>

            {/* Results List */}
            <div className="space-y-4">
                <ResultRow label={t('reports.form.wettedShaftSurface')} value={`${calculated.wettedShaftSurface.toFixed(2)} m`} />
                {showPipeFields && (
                    <ResultRow label={t('reports.form.wettedPipeSurface')} value={`${calculated.wettedPipeSurface.toFixed(2)} m`} />
                )}
                <ResultRow label={t('reports.form.totalWettedArea')} value={`${calculated.totalWettedArea.toFixed(2)} m`} />
                <ResultRow label={t('reports.form.allowedLossLiters')} value={`${calculated.allowedLossL.toFixed(2)} ${t('reports.form.volumeLossUnit')}`} />
                <ResultRow label={t('reports.form.allowedLossMm')} value={`${calculated.allowedLossMm.toFixed(2)} ${t('reports.form.waterLossUnitMm')}`} />
                {showPipeFields && formData.draft_id !== 5 && calculated.hydrostaticHeight > 0 && (
                    <ResultRow label={t('reports.form.hydrostaticHeight')} value={`${(calculated.hydrostaticHeight * 100).toFixed(0)} cm`} />
                )}
                <ResultRow label={t('reports.form.waterLoss')} value={`${calculated.waterLoss.toFixed(2)} ${t('reports.form.waterLossUnitMm')}`} />
                <ResultRow label={t('reports.form.volumeLoss')} value={`${calculated.waterVolumeLoss.toFixed(4)} ${t('reports.form.volumeLossUnit')}`} />
                <div className="pt-4 border-t border-border">
                    <ResultRow label={t('reports.form.result')} value={`${calculated.result.toFixed(2)} ${t('reports.form.resultUnit')}`} highlight />
                </div>
            </div>
        </div>
    </div>
);

const ResultRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div className="flex justify-between items-center">
        <span className={cn("text-sm", highlight ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
        <span className={cn("font-medium", highlight ? "text-lg text-primary" : "text-foreground")}>{value}</span>
    </div>
);
