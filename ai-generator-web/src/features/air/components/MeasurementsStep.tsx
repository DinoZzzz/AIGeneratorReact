import React from 'react';
import { ChevronLeft, Save } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import type { ReportForm } from '../../../types';
import type { CalculatedAirResults } from '../hooks';
import { formatTime } from '../calculations';

interface MeasurementsStepProps {
    formData: Partial<ReportForm>;
    calculated: CalculatedAirResults;
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
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Pressure and Time Card */}
                <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.pressureTime')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label={t('reports.form.startPressure')}
                            type="number"
                            step="0.01"
                            name="pressure_start"
                            value={formData.pressure_start}
                            onChange={onChange}
                        />
                        <Input
                            label={t('reports.form.endPressure')}
                            type="number"
                            step="0.01"
                            name="pressure_end"
                            value={formData.pressure_end}
                            onChange={onChange}
                        />
                        <Input
                            label={t('reports.form.startTime')}
                            type="time"
                            name="examination_start_time"
                            value={formData.examination_start_time}
                            onChange={onChange}
                        />
                        <Input
                            label={t('reports.form.endTime')}
                            type="time"
                            name="examination_end_time"
                            value={formData.examination_end_time}
                            onChange={onChange}
                        />
                        <Input
                            label={t('reports.form.stabilizationTime')}
                            type="text"
                            name="stabilization_time"
                            value={formData.stabilization_time}
                            onChange={onChange}
                            placeholder="00:00"
                        />
                    </div>
                </div>

                {/* Remarks Card */}
                <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.remarksSection')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="air-remark" className="text-sm font-medium mb-1 block">{t('reports.form.remarkLabel')}</label>
                            <textarea
                                id="air-remark"
                                name="remark"
                                value={formData.remark || ''}
                                onChange={onChange}
                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder={t('reports.form.remarkPlaceholder')}
                            />
                        </div>
                        <div>
                            <label htmlFor="air-deviation" className="text-sm font-medium mb-1 block">{t('reports.form.deviationLabel')}</label>
                            <textarea
                                id="air-deviation"
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
                <ResultsPanel calculated={calculated} t={t} />
            </div>
        </div>
    );
};

interface ResultsPanelProps {
    calculated: CalculatedAirResults;
    t: (key: string) => string;
}

export const ResultsPanel = ({ calculated, t }: ResultsPanelProps) => (
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
                <ResultRow label={t('reports.form.pressureLoss')} value={`${calculated.pressureLoss.toFixed(2)} mbar`} />
                <div className="pt-4 border-t border-border">
                    <ResultRow label={t('reports.form.allowedLoss')} value={`${calculated.allowedLoss.toFixed(2)} mbar`} highlight />
                </div>
                <div className="pt-4 border-t border-border">
                    <ResultRow label={t('reports.form.requiredTime')} value={`${formatTime(calculated.requiredTestTime)}`} />
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
