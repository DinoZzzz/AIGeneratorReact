import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import type { User, ReportForm, ReportFile } from '../types';
import { FileUploader } from './FileUploader';
import { useLanguage } from '../context/LanguageContext';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (data: ExportMetaData, selectedReports?: ReportForm[]) => void;
    certifiers?: User[]; // Assuming we might fetch these, or user enters name
    loading?: boolean;
    defaultValues?: Partial<ExportMetaData>;
    reports?: ReportForm[]; // Optional: if provided, allows selection inside dialog
    constructionId?: string;
    uploadedFiles?: ReportFile[];
    onFileUploaded?: (file: ReportFile) => void;
    onFileDeleted?: (fileId: string) => void;
}

export interface ExportMetaData {
    constructionPart: string;
    drainage: string;
    airRemark: string;
    airDeviation: string;
    waterRemark: string;
    waterDeviation: string;
    certifierName: string;
    includePdfs?: boolean;
}

export const ExportDialog = ({ open, onOpenChange, onConfirm, loading = false, defaultValues, reports, constructionId, uploadedFiles = [], onFileUploaded, onFileDeleted }: ExportDialogProps) => {
    const { t } = useLanguage();
    const [data, setData] = useState<ExportMetaData>({
        constructionPart: defaultValues?.constructionPart || '',
        drainage: defaultValues?.drainage || '',
        airRemark: defaultValues?.airRemark || '',
        airDeviation: defaultValues?.airDeviation || '',
        waterRemark: defaultValues?.waterRemark || '',
        waterDeviation: defaultValues?.waterDeviation || '',
        certifierName: defaultValues?.certifierName || '',
        includePdfs: defaultValues?.includePdfs || false,
    });

    const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());

    // Update state when defaultValues change or dialog opens
    useEffect(() => {
        if (open) {
            if (defaultValues && data.constructionPart === '' && defaultValues.constructionPart) {
                setData(prev => ({
                    ...prev,
                    ...defaultValues
                }));
            }
            // If reports are provided, select all by default
            if (reports && reports.length > 0) {
                const allIds = reports.map(r => r.id).filter((id): id is string => !!id);
                setSelectedReportIds(new Set(allIds));
            } else {
                setSelectedReportIds(new Set());
            }
        }
    }, [open, defaultValues, reports]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let selectedReports: ReportForm[] | undefined;
        if (reports && reports.length > 0) {
            if (selectedReportIds.size === 0) {
                alert("Please select at least one report to export.");
                return;
            }
            selectedReports = reports.filter(r => r.id && selectedReportIds.has(r.id));
        }

        onConfirm(data, selectedReports);

        // Don't close immediately if loading, let parent handle it or close after success
        if (!loading) {
            onOpenChange(false);
        }
    };

    const toggleReport = (id: string) => {
        const newSelected = new Set(selectedReportIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedReportIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (!reports) return;
        if (selectedReportIds.size === reports.length) {
            setSelectedReportIds(new Set());
        } else {
            const allIds = reports.map(r => r.id).filter((id): id is string => !!id);
            setSelectedReportIds(new Set(allIds));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader onClose={() => onOpenChange(false)}>
                    <DialogTitle className="text-foreground">{t('export.optionsTitle')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">

                    {/* Report Selection Section */}
                    {reports && reports.length > 0 && (() => {
                        const waterReports = reports.filter(r => r.type_id === 1 || (!r.type_id && r.section_name && r.material_type_id === 1));
                        const airReports = reports.filter(r => r.type_id === 2 || (!r.type_id && r.section_name && r.material_type_id === 2));

                        return (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm text-foreground">{t('export.selectReports')}</h3>
                                    <button
                                        type="button"
                                        onClick={toggleSelectAll}
                                        className="text-xs text-primary hover:text-primary/80"
                                    >
                                        {selectedReportIds.size === reports.length ? t('export.deselectAll') : t('export.selectAll')}
                                    </button>
                                </div>

                                {/* Water Reports Container */}
                                {waterReports.length > 0 && (
                                    <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50/50 dark:bg-blue-950/20">
                                        <h4 className="font-bold text-sm text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            💧 {t('reports.water')} Reports
                                        </h4>
                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {waterReports.map((report) => {
                                                const isSection = report.section_name && !report.draft_id;
                                                return (
                                                    <div key={report.id} className={`flex items-center space-x-2 ${isSection ? 'bg-blue-100 dark:bg-blue-900/40 py-2 px-2 rounded border-l-4 border-blue-600' : 'bg-white dark:bg-slate-900 py-1.5 px-2 rounded'}`}>
                                                        <input
                                                            type="checkbox"
                                                            id={`report-${report.id}`}
                                                            checked={report.id ? selectedReportIds.has(report.id) : false}
                                                            onChange={() => report.id && toggleReport(report.id)}
                                                            className="rounded border-input text-primary focus:ring-ring"
                                                        />
                                                        <label htmlFor={`report-${report.id}`} className={`text-sm text-foreground flex-1 truncate cursor-pointer ${isSection ? 'font-bold' : ''}`}>
                                                            {isSection ? (
                                                                <span className="text-blue-800 dark:text-blue-200">📋 {report.section_name}</span>
                                                            ) : (
                                                                <>
                                                                    {(report.dionica || report.stock) && (
                                                                        <>
                                                                            <span className="font-medium text-foreground">{report.dionica || report.stock}</span>
                                                                            <span className="mx-1 text-muted-foreground">-</span>
                                                                        </>
                                                                    )}
                                                                    <span className="text-muted-foreground">{new Date(report.examination_date).toLocaleDateString()}</span>
                                                                </>
                                                            )}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Air Reports Container */}
                                {airReports.length > 0 && (
                                    <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-3 bg-purple-50/50 dark:bg-purple-950/20">
                                        <h4 className="font-bold text-sm text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            💨 {t('reports.air')} Reports
                                        </h4>
                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {airReports.map((report) => {
                                                const isSection = report.section_name && !report.draft_id;
                                                return (
                                                    <div key={report.id} className={`flex items-center space-x-2 ${isSection ? 'bg-purple-100 dark:bg-purple-900/40 py-2 px-2 rounded border-l-4 border-purple-600' : 'bg-white dark:bg-slate-900 py-1.5 px-2 rounded'}`}>
                                                        <input
                                                            type="checkbox"
                                                            id={`report-${report.id}`}
                                                            checked={report.id ? selectedReportIds.has(report.id) : false}
                                                            onChange={() => report.id && toggleReport(report.id)}
                                                            className="rounded border-input text-primary focus:ring-ring"
                                                        />
                                                        <label htmlFor={`report-${report.id}`} className={`text-sm text-foreground flex-1 truncate cursor-pointer ${isSection ? 'font-bold' : ''}`}>
                                                            {isSection ? (
                                                                <span className="text-purple-800 dark:text-purple-200">📋 {report.section_name}</span>
                                                            ) : (
                                                                <>
                                                                    {(report.dionica || report.stock) && (
                                                                        <>
                                                                            <span className="font-medium text-foreground">{report.dionica || report.stock}</span>
                                                                            <span className="mx-1 text-muted-foreground">-</span>
                                                                        </>
                                                                    )}
                                                                    <span className="text-muted-foreground">{new Date(report.examination_date).toLocaleDateString()}</span>
                                                                </>
                                                            )}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs text-muted-foreground text-right pt-2 border-t border-border">
                                    {selectedReportIds.size} {t('export.selected')}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">{t('export.constructionPart')}</label>
                            <input
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.constructionPart}
                                onChange={(e) => setData({ ...data, constructionPart: e.target.value })}
                                placeholder={t('export.constructionPartPlaceholder')}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">{t('export.drainage')}</label>
                            <input
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.drainage}
                                onChange={(e) => setData({ ...data, drainage: e.target.value })}
                                placeholder={t('export.drainagePlaceholder')}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">{t('reports.airMethod')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('export.remark')}</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.airRemark}
                                    onChange={(e) => setData({ ...data, airRemark: e.target.value })}
                                    placeholder={t('export.remarkPlaceholder')}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('export.deviation')}</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.airDeviation}
                                    onChange={(e) => setData({ ...data, airDeviation: e.target.value })}
                                    placeholder={t('export.deviationPlaceholder')}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">{t('reports.waterMethod')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('export.remark')}</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.waterRemark}
                                    onChange={(e) => setData({ ...data, waterRemark: e.target.value })}
                                    placeholder={t('export.remarkPlaceholder')}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('export.deviation')}</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.waterDeviation}
                                    onChange={(e) => setData({ ...data, waterDeviation: e.target.value })}
                                    placeholder={t('export.deviationPlaceholder')}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">{t('export.certifierName')}</label>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={data.certifierName}
                            onChange={(e) => setData({ ...data, certifierName: e.target.value })}
                            placeholder={t('export.certifierPlaceholder')}
                            disabled={loading}
                        />
                    </div>

                    {/* File Upload Section */}
                    {constructionId && (
                        <div className="space-y-2 border-t border-border pt-4">
                            <h3 className="font-semibold text-sm text-foreground">{t("export.attachments")} ({uploadedFiles.length})</h3>
                            <p className="text-xs text-muted-foreground">{t("export.attachmentsHelp")}</p>
                            <FileUploader
                                constructionId={constructionId}
                                onUploadComplete={onFileUploaded}
                                onDelete={onFileDeleted}
                                files={uploadedFiles}
                            />
                        </div>
                    )}

                    {/* PDF Inclusion Option */}
                    {reports && reports.length > 0 && (
                        <div className="space-y-2 border-t border-border pt-4">
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="includePdfs"
                                    checked={data.includePdfs}
                                    onChange={(e) => setData({ ...data, includePdfs: e.target.checked })}
                                    className="rounded border-input text-primary focus:ring-ring mt-0.5"
                                    disabled={loading}
                                />
                                <div className="flex-1">
                                    <label htmlFor="includePdfs" className="text-sm font-medium leading-none cursor-pointer">
                                        {t('export.includePdfs')}
                                    </label>
                                    <p className="text-xs text-muted-foreground mt-1">{t('export.includePdfsHelp')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>{t('export.cancel')}</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? t('export.exporting') : t('export.exportReport')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};



