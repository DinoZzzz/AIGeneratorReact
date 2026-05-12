import React from 'react';
import { Check, X, ChevronUp } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import type { CalculatedAirResults } from '../hooks';
import { formatTime } from '../calculations';

interface MobileResultsDrawerProps {
    calculated: CalculatedAirResults;
    showMobileResults: boolean;
    setShowMobileResults: (show: boolean) => void;
    t: (key: string) => string;
}

export const MobileResultsDrawer = ({
    calculated,
    showMobileResults,
    setShowMobileResults,
    t
}: MobileResultsDrawerProps) => {
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
                            <Button variant="ghost" size="icon" onClick={() => setShowMobileResults(false)} className="-mr-2" aria-label={t('common.closeResults')}>
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
                                <ResultRow label={t('reports.form.pressureLoss')} value={`${calculated.pressureLoss.toFixed(2)} mbar`} />
                                <div className="pt-4 border-t border-border">
                                    <ResultRow label={t('reports.form.allowedLoss')} value={`${calculated.allowedLoss.toFixed(2)} mbar`} highlight />
                                </div>
                                <div className="pt-4 border-t border-border">
                                    <ResultRow label={t('reports.form.requiredTime')} value={`${formatTime(calculated.requiredTestTime)}`} />
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
