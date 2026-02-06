import { Link } from 'react-router-dom';
import { Plus, FileText, Trash2, FileDown, Type } from 'lucide-react';

interface ReportsActionBarProps {
    customerId: string;
    constructionId: string;
    selectedCount: number;
    hasWaterAccreditation: boolean;
    hasAirAccreditation: boolean;
    hasAnyAccreditation: boolean;
    isArchived: boolean;
    isNewReportOpen: boolean;
    isAddSectionOpen: boolean;
    onToggleNewReport: () => void;
    onToggleAddSection: () => void;
    onDeleteSelected: () => void;
    onAddSection: (typeId: 1 | 2) => void;
    onExportDialog: () => void;
    onBulkExport: () => void;
    t: (key: string) => string;
}

export const ReportsActionBar = ({
    customerId,
    constructionId,
    selectedCount,
    hasWaterAccreditation,
    hasAirAccreditation,
    hasAnyAccreditation,
    isArchived,
    isNewReportOpen,
    isAddSectionOpen,
    onToggleNewReport,
    onToggleAddSection,
    onDeleteSelected,
    onAddSection,
    onExportDialog,
    onBulkExport,
    t,
}: ReportsActionBarProps) => {
    return (
        <div className="flex flex-wrap gap-2 md:space-x-3">
            {selectedCount > 0 && (
                <button
                    onClick={onDeleteSelected}
                    className="inline-flex items-center px-3 py-2 md:px-4 border border-destructive/40 rounded-md shadow-sm text-sm font-medium text-destructive bg-transparent hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive transition-colors"
                >
                    <Trash2 className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">{t('reports.deleteSelected')} ({selectedCount})</span>
                </button>
            )}
            <div className="relative inline-block text-left">
                <button
                    onClick={onToggleNewReport}
                    disabled={!hasAnyAccreditation || isArchived}
                    title={isArchived ? t('constructions.archived') : (!hasAnyAccreditation ? "You don't have any accreditations" : "")}
                    className="inline-flex items-center px-3 py-2 md:px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">{t('reports.newReport')}</span>
                    <span className="md:hidden">{t('reports.new')}</span>
                </button>
                {isNewReportOpen && (
                    <div className="absolute left-0 md:right-0 md:left-auto mt-2 w-48 rounded-md shadow-lg bg-card border border-border shadow-border/40 focus:outline-none z-50">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            {hasWaterAccreditation && (
                                <Link
                                    to={`/customers/${customerId}/constructions/${constructionId}/reports/new/water`}
                                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                                    role="menuitem"
                                    onClick={onToggleNewReport}
                                >
                                    {t('reports.waterMethod')}
                                </Link>
                            )}
                            {hasAirAccreditation && (
                                <Link
                                    to={`/customers/${customerId}/constructions/${constructionId}/reports/new/air`}
                                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                                    role="menuitem"
                                    onClick={onToggleNewReport}
                                >
                                    {t('reports.airMethod')}
                                </Link>
                            )}
                            {!hasAnyAccreditation && (
                                <div className="px-4 py-2 text-sm text-muted-foreground">
                                    No accreditations available
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {isNewReportOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={onToggleNewReport}
                />
            )}
            <div className="relative inline-block text-left">
                <button
                    onClick={onToggleAddSection}
                    disabled={!hasAnyAccreditation || isArchived}
                    title={isArchived ? t('constructions.archived') : (!hasAnyAccreditation ? "You don't have any accreditations" : "")}
                    className="inline-flex items-center px-3 py-2 md:px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Type className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">{t('reports.addSection')}</span>
                </button>
                {isAddSectionOpen && (
                    <div className="absolute left-0 md:right-0 md:left-auto mt-2 w-48 rounded-md shadow-lg bg-card border border-border shadow-border/40 focus:outline-none z-50">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            {hasWaterAccreditation && (
                                <button
                                    onClick={() => {
                                        onAddSection(1);
                                        onToggleAddSection();
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                                    role="menuitem"
                                >
                                    {t('reports.water')} Section
                                </button>
                            )}
                            {hasAirAccreditation && (
                                <button
                                    onClick={() => {
                                        onAddSection(2);
                                        onToggleAddSection();
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                                    role="menuitem"
                                >
                                    {t('reports.air')} Section
                                </button>
                            )}
                            {!hasAnyAccreditation && (
                                <div className="px-4 py-2 text-sm text-muted-foreground">
                                    No accreditations available
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {isAddSectionOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={onToggleAddSection}
                />
            )}
            <button
                onClick={onExportDialog}
                className="inline-flex items-center px-3 py-2 md:px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
            >
                <FileText className="h-5 w-5 md:mr-2 text-muted-foreground" />
                <span className="hidden md:inline">{t('reports.generateReports')}</span>
                <span className="md:hidden">{t('reports.generate')}</span>
            </button>
            <button
                onClick={onBulkExport}
                className="inline-flex items-center px-3 py-2 md:px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
            >
                <FileDown className="h-5 w-5 md:mr-2 text-muted-foreground" />
                <span className="hidden md:inline">{selectedCount > 0 ? `${t('reports.exportSelected')} (${selectedCount})` : t('reports.exportAll')}</span>
                <span className="md:hidden">{t('reports.export')}</span>
            </button>
        </div>
    );
};
