import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import type { User, ReportForm, ReportFile } from '../types';
import { FileUploader } from './FileUploader';
import { useLanguage } from '../context/LanguageContext';
import { certifierService } from '../services/certifierService';
import { useCertifiers } from '../hooks/useCertifiers';
import { useToast } from '../context/ToastContext';

const DEFAULT_CONSTRUCTION_PART = 'Sustav odvodnje otpadnih voda';
const WATER_DEVIATION_OPTION_LOW_H2 = 'h2 < 100 cm';
const WATER_DEVIATION_OPTION_SOME_SECTIONS = 'Kod pojedinih dionica h2 < 100 cm';
const LEGACY_WATER_DEVIATION_OPTION_SOME_SECTIONS = 'Kod pojedinih dionica h2<100cm';

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
    certifierSignatureUrl?: string;
    includePdfs?: boolean;
}

const normalizeWaterDeviation = (value?: string): string => {
    if (!value) return WATER_DEVIATION_OPTION_LOW_H2;
    if (value === WATER_DEVIATION_OPTION_LOW_H2 || value === WATER_DEVIATION_OPTION_SOME_SECTIONS) {
        return value;
    }
    if (value.trim() === LEGACY_WATER_DEVIATION_OPTION_SOME_SECTIONS) {
        return WATER_DEVIATION_OPTION_SOME_SECTIONS;
    }
    return WATER_DEVIATION_OPTION_LOW_H2;
};

const getInitialExportData = (defaultValues?: Partial<ExportMetaData>): ExportMetaData => ({
    constructionPart: defaultValues?.constructionPart || DEFAULT_CONSTRUCTION_PART,
    drainage: defaultValues?.drainage || '',
    airRemark: defaultValues?.airRemark || '',
    airDeviation: defaultValues?.airDeviation || '',
    waterRemark: defaultValues?.waterRemark || '',
    waterDeviation: normalizeWaterDeviation(defaultValues?.waterDeviation),
    certifierName: defaultValues?.certifierName || '',
    includePdfs: defaultValues?.includePdfs ?? false,
});

export const ExportDialog = ({ open, onOpenChange, onConfirm, loading = false, defaultValues, reports, constructionId, uploadedFiles = [], onFileUploaded, onFileDeleted }: ExportDialogProps) => {
    const { t } = useLanguage();
    const { error: showError } = useToast();
    const [data, setData] = useState<ExportMetaData>(getInitialExportData(defaultValues));

    const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
    const { data: certifiers = [] } = useCertifiers();

    // Reset state when dialog opens + set default certifier
    useEffect(() => {
        if (open) {
            const initial = getInitialExportData(defaultValues);
            // Set default certifier if available and no explicit default provided
            if (!initial.certifierName && certifiers.length > 0) {
                const defaultCertifier = certifiers.find(c => c.is_default) || certifiers[0];
                initial.certifierName = certifierService.getDisplayName(defaultCertifier);
            }
            setData(initial);
            // If reports are provided, select all by default
            if (reports && reports.length > 0) {
                const allIds = reports.map(r => r.id).filter((id): id is string => !!id);
                setSelectedReportIds(new Set(allIds));
            } else {
                setSelectedReportIds(new Set());
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Set default certifier when certifiers load after dialog is already open
    useEffect(() => {
        if (open && certifiers.length > 0 && !data.certifierName) {
            const defaultCertifier = certifiers.find(c => c.is_default) || certifiers[0];
            setData(prev => ({
                ...prev,
                certifierName: certifierService.getDisplayName(defaultCertifier)
            }));
        }
    }, [certifiers, data.certifierName, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let selectedReports: ReportForm[] | undefined;
        if (reports && reports.length > 0) {
            if (selectedReportIds.size === 0) {
                showError(t('export.selectAtLeastOneReport'));
                return;
            }
            selectedReports = reports.filter(r => r.id && selectedReportIds.has(r.id));
            const selectedRealReports = selectedReports.filter((report) => !report.section_name);
            if (selectedRealReports.length === 0) {
                showError(t('export.selectAtLeastOneReport'));
                return;
            }
        }

        // Find selected certifier to get signature URL
        const selectedCertifier = certifiers.find(c =>
            certifierService.getDisplayName(c) === data.certifierName
        );

        const exportData: ExportMetaData = {
            ...data,
            certifierSignatureUrl: selectedCertifier?.signature_url
        };

        onConfirm(exportData, selectedReports);

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
                        const waterReports = reports.filter(
                            (report) => report.type_id === 1 || (report.section_name && (report.material_type_id === 1 || report.type_id === 1))
                        );
                        const airReports = reports.filter(
                            (report) => report.type_id === 2 || (report.section_name && (report.material_type_id === 2 || report.type_id === 2))
                        );

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
                                            💧 {t('reports.water')} {t('reports.title')}
                                        </h4>
                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {waterReports.map((report) => {
                                                const isSection = Boolean(report.section_name);
                                                return (
                                                    <div key={report.id} className={`flex items-center space-x-2 ${isSection ? 'bg-blue-100 dark:bg-blue-900/40 py-2 px-2 rounded border-l-4 border-blue-600' : 'bg-card py-1.5 px-2 rounded'}`}>
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
                                            💨 {t('reports.air')} {t('reports.title')}
                                        </h4>
                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {airReports.map((report) => {
                                                const isSection = Boolean(report.section_name);
                                                return (
                                                    <div key={report.id} className={`flex items-center space-x-2 ${isSection ? 'bg-purple-100 dark:bg-purple-900/40 py-2 px-2 rounded border-l-4 border-purple-600' : 'bg-card py-1.5 px-2 rounded'}`}>
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
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.waterDeviation}
                                    onChange={(e) => setData({ ...data, waterDeviation: e.target.value })}
                                    disabled={loading}
                                >
                                    <option value={WATER_DEVIATION_OPTION_LOW_H2}>{t('export.waterDeviationOptionLowH2')}</option>
                                    <option value={WATER_DEVIATION_OPTION_SOME_SECTIONS}>{t('export.waterDeviationOptionSomeSections')}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">{t('export.certifierName')}</label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={data.certifierName}
                            onChange={(e) => setData({ ...data, certifierName: e.target.value })}
                            disabled={loading}
                        >
                            {certifiers.length > 0 ? (
                                certifiers.map((certifier) => (
                                    <option key={certifier.id} value={certifierService.getDisplayName(certifier)}>
                                        {certifierService.getDisplayName(certifier)}
                                        {certifier.is_default ? ` (${t('certifiers.default')})` : ''}
                                    </option>
                                ))
                            ) : (
                                <option value="">{t('common.selectPlaceholder')}</option>
                            )}
                        </select>
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
