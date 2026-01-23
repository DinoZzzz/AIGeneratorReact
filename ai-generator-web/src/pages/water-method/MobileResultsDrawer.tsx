import React from 'react';
import { Check, X, ChevronUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import type { ReportForm } from '../../types';
import type { CalculatedResults } from './useWaterCalculations';
import { ResultsPanel } from './MeasurementsStep';

interface MobileResultsDrawerProps {
    formData: Partial<ReportForm>;
    calculated: CalculatedResults;
    showMobileResults: boolean;
    setShowMobileResults: (show: boolean) => void;
    t: (key: string) => string;
}

export const MobileResultsDrawer = ({
    formData,
    calculated,
    showMobileResults,
    setShowMobileResults,
    t
}: MobileResultsDrawerProps) => {
    const showPipeFields = [2, 3, 5].includes(formData.draft_id || 0);

    return (
        <>
            {/* FAB / Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border lg:hidden z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center space-x-3">
                    <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center border",
                        calculated.satisfies
                            ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                            : "bg-red-100 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400"
                    )}>
                        {calculated.satisfies ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t('reports.form.status')}</span>
                        <span className={cn("font-bold text-sm", calculated.satisfies ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                            {calculated.satisfies ? t('reports.form.satisfies') : t('reports.form.failed')}
                        </span>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowMobileResults(true)}>
                    {t('reports.form.details')} <ChevronUp className="ml-2 h-4 w-4" />
                </Button>
            </div>

            {/* Mobile Results Drawer/Modal */}
            {showMobileResults && (
                <div className="fixed inset-0 z-[60] lg:hidden flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileResults(false)}>
                    <div className="bg-card w-full max-w-md rounded-t-xl p-6 space-y-6 animate-in slide-in-from-bottom duration-200 border-t border-border shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">{t('reports.form.calculatedResults')}</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowMobileResults(false)} className="-mr-2" aria-label="Close results">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

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

                            <Button className="w-full" size="lg" onClick={() => setShowMobileResults(false)}>
                                {t('common.close')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const ResultRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div className="flex justify-between items-center">
        <span className={cn("text-sm", highlight ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
        <span className={cn("font-medium", highlight ? "text-lg text-primary" : "text-foreground")}>{value}</span>
    </div>
);
