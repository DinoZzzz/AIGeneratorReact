import { useEffect, useState } from 'react';
import type { DragEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { historyService } from '../services/historyService';
import type { ReportExport, ReportExportForm, ReportForm } from '../types';
import { generateWordDocument } from '../services/wordExportService';
import type { ExportMetaData } from '../components/ExportDialog';
import { Loader2, ArrowLeft, Download, GripVertical, FileText, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generatePDF, generateBulkPDF } from '../lib/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { ReportFile } from '../types';

export const HistoryDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { t } = useLanguage();
    const [exportData, setExportData] = useState<ReportExport | null>(null);
    const [forms, setForms] = useState<ReportExportForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [actionMessage, setActionMessage] = useState<{ text: string; type: 'info' | 'error' } | null>(null);
    const [reportFiles, setReportFiles] = useState<ReportFile[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                const [exportResult, formsResult] = await Promise.all([
                    historyService.getById(id),
                    historyService.getExportForms(id)
                ]);
                setExportData(exportResult);
                setForms(formsResult);

                // Fetch report files for this construction
                if (exportResult.construction_id) {
                    const { data: files } = await supabase
                        .from('report_files')
                        .select('*')
                        .eq('construction_id', exportResult.construction_id)
                        .order('created_at', { ascending: true });

                    if (files) {
                        setReportFiles(files);
                    }
                }
            } catch (error) {
                console.error('Failed to load export details:', error);
                alert('Failed to load details.');
                navigate('/history');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, navigate]);

    const handleDownloadReport = async (formId: string) => {
        if (!exportData) return;

        setActionMessage({ text: t('exportDetails.downloading'), type: 'info' });
        setDownloadingFormId(formId);
        try {
            // Fetch the full report data for this specific form
            const { data: reportData, error } = await supabase
                .from('report_forms')
                .select('*')
                .eq('id', formId)
                .single();

            if (error) throw error;
            if (!reportData) throw new Error('Report not found');

            // Generate single PDF
            generatePDF(reportData, profile || undefined);
            setActionMessage(null);
        } catch (error) {
            console.error('Failed to download report:', error);
            setActionMessage({ text: t('exportDetails.downloadFailed'), type: 'error' });
        } finally {
            setDownloadingFormId(null);
        }
    };

    const handleBulkExport = async () => {
        if (forms.length === 0 || !exportData) return;

        setIsExporting(true);
        setActionMessage({ text: t('exportDetails.generatingPdf'), type: 'info' });
        try {
            // Get the form IDs to export
            const formIdsToExport = selectedIds.size > 0
                ? Array.from(selectedIds)
                : forms
                    .map(f => f.form_id || f.report_form?.id)
                    .filter((id): id is string => !!id);

            // Fetch all report forms
            const { data: reportForms, error } = await supabase
                .from('report_forms')
                .select('*')
                .in('id', formIdsToExport);

            if (error) throw error;
            if (!reportForms || reportForms.length === 0) throw new Error('No reports found');

            const formMap = new Map(reportForms.map((rf) => [rf.id, rf as ReportForm]));
            const orderedReports = formIdsToExport
                .map(id => formMap.get(id))
                .filter((rf): rf is ReportForm => !!rf);
            if (orderedReports.length === 0) throw new Error('No reports found');

            // Generate bulk PDF
            generateBulkPDF(orderedReports, `${exportData.construction_part}_Reports.pdf`, profile || undefined);
            setActionMessage(null);
        } catch (error) {
            console.error('Failed to export reports:', error);
            setActionMessage({ text: t('exportDetails.exportFailed'), type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleWordExport = async () => {
        if (forms.length === 0 || !exportData) return;

        setIsExporting(true);
        setActionMessage({ text: t('exportDetails.generatingWord'), type: 'info' });
        try {
            const formIdsToExport = selectedIds.size > 0
                ? Array.from(selectedIds)
                : forms
                    .map(f => f.form_id || f.report_form?.id)
                    .filter((id): id is string => !!id);

            const { data: reportForms, error } = await supabase
                .from('report_forms')
                .select('*')
                .in('id', formIdsToExport);

            if (error) throw error;
            if (!reportForms || reportForms.length === 0) throw new Error('No reports found');

            const formMap = new Map(reportForms.map((rf) => [rf.id, rf as ReportForm]));
            const orderedReports = formIdsToExport
                .map(id => formMap.get(id))
                .filter((rf): rf is ReportForm => !!rf);
            if (orderedReports.length === 0) throw new Error('No reports found');

            const metaData: ExportMetaData = {
                certifierName: exportData.certifier_name
                    || formatName(exportData.certifier)
                    || formatName(exportData.user)
                    || '',
                constructionPart: exportData.construction_part,
                drainage: exportData.drainage || '',
                airRemark: exportData.air_remark || '',
                airDeviation: exportData.air_deviation || '',
                waterRemark: exportData.water_remark || '',
                waterDeviation: exportData.water_deviation || ''
            };

            await generateWordDocument(orderedReports, metaData);
            setActionMessage(null);
        } catch (error) {
            console.error('Failed to export Word document:', error);
            setActionMessage({ text: t('exportDetails.wordFailed'), type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const toggleSelectAll = () => {
        const allIds = forms
            .map(f => f.form_id || f.report_form?.id)
            .filter((id): id is string => !!id);

        if (selectedIds.size === allIds.length && allIds.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allIds));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (dropIndex: number) => {
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const previous = [...forms];
        const newForms = [...forms];
        const [dragged] = newForms.splice(draggedIndex, 1);
        newForms.splice(dropIndex, 0, dragged);

        const reordered = newForms.map((f, idx) => ({ ...f, ordinal: idx + 1 }));
        setForms(reordered);
        setDraggedIndex(null);

        try {
            await Promise.all(
                reordered.map(f =>
                    supabase.from('report_export_forms')
                        .update({ ordinal: f.ordinal })
                        .eq('id', f.id)
                )
            );
        } catch (error) {
            console.error('Failed to update order:', error);
            alert('Failed to save new order.');
            setForms(previous);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!exportData) return null;

    const formatName = (p?: { name?: string; last_name?: string; email?: string }) => {
        if (!p) return undefined;
        const full = [p.name, p.last_name].filter(Boolean).join(' ').trim();
        return full || p.email;
    };

    const firstWaterRemark = forms.find(f => f.type_id === 1)?.report_form?.remark;
    const firstWaterDeviation = forms.find(f => f.type_id === 1)?.report_form?.deviation;
    const firstAirRemark = forms.find(f => f.type_id === 2)?.report_form?.remark;
    const firstAirDeviation = forms.find(f => f.type_id === 2)?.report_form?.deviation;
    const anyRemark = forms.find(f => f.report_form?.remark)?.report_form?.remark;
    const anyDeviation = forms.find(f => f.report_form?.deviation)?.report_form?.deviation;

    const waterRemark = exportData.water_remark || firstWaterRemark || anyRemark || '-';
    const waterDeviation = exportData.water_deviation || firstWaterDeviation || anyDeviation || '-';
    const airRemark = exportData.air_remark || firstAirRemark || anyRemark || '-';
    const airDeviation = exportData.air_deviation || firstAirDeviation || anyDeviation || '-';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/history')}
                        className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl font-bold text-foreground">
                        {t('exportDetails.title')}:{' '}
                        <button
                            onClick={() => exportData.construction_id && navigate(`/customers/${exportData.customer_id}/constructions/${exportData.construction_id}/reports`)}
                            className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                        >
                            {exportData.construction_part}
                        </button>
                    </h1>
                </div>
            </div>

            {actionMessage && (
                <div className={`px-4 py-3 rounded-md border ${actionMessage.type === 'error' ? 'border-destructive text-destructive bg-destructive/10' : 'border-border text-foreground bg-muted/50'}`}>
                    {actionMessage.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Metadata Card */}
                <div className="bg-card shadow rounded-lg p-6 space-y-4 border border-border">
                    <h2 className="text-lg font-medium text-foreground border-b border-border pb-2">{t('exportDetails.info')}</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">{t('exportDetails.certifier')}</p>
                            <p className="font-medium text-foreground">
                                {exportData.certifier_name || formatName(exportData.certifier) || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t('exportDetails.createdBy')}</p>
                            <p className="font-medium text-foreground">
                                {exportData.certifier_name || formatName(exportData.user) || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t('exportDetails.examinationDate')}</p>
                            <p className="font-medium text-foreground">{new Date(exportData.examination_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t('exportDetails.creationTime')}</p>
                            <p className="font-medium text-foreground">{new Date(exportData.created_at).toLocaleString()}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-muted-foreground">{t('exportDetails.drainage')}</p>
                            <p className="font-medium text-foreground">{exportData.drainage || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Remarks Card */}
                <div className="bg-card shadow rounded-lg p-6 space-y-4 border border-border">
                    <h2 className="text-lg font-medium text-foreground border-b border-border pb-2">{t('exportDetails.remarks')}</h2>
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-muted-foreground">{t('exportDetails.waterRemark')}</p>
                            <p className="font-medium text-foreground">{waterRemark}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t('exportDetails.waterDeviation')}</p>
                            <p className="font-medium text-foreground">{waterDeviation}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t('exportDetails.airRemark')}</p>
                            <p className="font-medium text-foreground">{airRemark}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t('exportDetails.airDeviation')}</p>
                            <p className="font-medium text-foreground">{airDeviation}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attachments Section */}
            {reportFiles.length > 0 && (
                <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-lg font-medium text-foreground">{t('exportDetails.attachments')} ({reportFiles.length})</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {reportFiles.map((file) => {
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.file_name);
                                const { data } = supabase.storage
                                    .from('report-files')
                                    .getPublicUrl(file.file_path);

                                return (
                                    <div
                                        key={file.id}
                                        className="border border-border rounded-lg overflow-hidden bg-muted/30 hover:shadow-md transition-shadow"
                                    >
                                        {isImage ? (
                                            <a
                                                href={data.publicUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={data.publicUrl}
                                                        alt={file.description || file.file_name}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                                    />
                                                </div>
                                            </a>
                                        ) : (
                                            <a
                                                href={data.publicUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                <div className="aspect-video bg-muted flex items-center justify-center">
                                                    <FileText className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                            </a>
                                        )}
                                        <div className="p-3">
                                            <p className="text-sm font-medium text-foreground truncate" title={file.file_name}>
                                                {file.file_name}
                                            </p>
                                            {file.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {file.description}
                                                </p>
                                            )}
                                            <a
                                                href={data.publicUrl}
                                                download
                                                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2"
                                            >
                                                <Download className="h-3 w-3" />
                                                {t('exportDetails.download')}
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Included Reports */}
            <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                <div className="px-4 sm:px-6 py-4 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-lg font-medium text-foreground">{t('exportDetails.includedReports')} ({forms.length})</h2>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <button
                                onClick={handleWordExport}
                                disabled={isExporting || forms.length === 0}
                                className="inline-flex justify-center items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('exportDetails.exporting')}
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4 mr-2" />
                                        {selectedIds.size > 0 ? `${t('exportDetails.exportWord')} (${selectedIds.size})` : t('exportDetails.exportWord')}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleBulkExport}
                                disabled={isExporting || forms.length === 0}
                                className="inline-flex justify-center items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('exportDetails.exporting')}
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        {selectedIds.size > 0 ? `${t('exportDetails.exportPdf')} (${selectedIds.size})` : t('exportDetails.exportAllPdf')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-border">
                    <div className="p-4 bg-muted/30 flex items-center justify-between border-b border-border">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                className="rounded border-input text-primary focus:ring-ring mr-3 h-5 w-5"
                                checked={
                                    forms.length > 0 &&
                                    selectedIds.size === forms.filter(f => f.form_id || f.report_form?.id).length
                                }
                                onChange={toggleSelectAll}
                            />
                            <span className="text-sm font-medium text-foreground">{t('exportDetails.selectAll')}</span>
                        </div>
                    </div>
                    {forms.map((item, index) => {
                        const formId = item.form_id || item.report_form?.id;
                        const isSelected = formId ? selectedIds.has(formId) : false;
                        const displayOrdinal = item.ordinal && item.ordinal > 0 ? item.ordinal : index + 1;

                        return (
                            <div key={item.id} className="p-4 space-y-3 bg-card">
                                <div className="flex items-start gap-3">
                                    <div className="pt-1">
                                        <input
                                            type="checkbox"
                                            className="rounded border-input text-primary focus:ring-ring h-5 w-5"
                                            checked={isSelected}
                                            onChange={() => formId && toggleSelect(formId)}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-xs font-medium text-muted-foreground">#{displayOrdinal}</span>
                                                <div className="font-medium text-foreground">
                                                    {item.type_id === 1 ? t('exportDetails.water') : t('exportDetails.air')} {t('exportDetails.report')}
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${item.report_form?.satisfies
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                                }`}>
                                                {item.report_form?.satisfies ? t('common.yes') : t('common.no')}
                                            </span>
                                        </div>

                                        <div className="text-sm text-muted-foreground">
                                            <span className="font-medium">{t('exportDetails.dionica')}:</span> {item.report_form?.dionica || item.report_form?.stock || '-'}
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                onClick={() => formId && navigate(item.type_id === 1
                                                    ? `/customers/${exportData.customer_id}/constructions/${exportData.construction_id}/reports/${formId}`
                                                    : `/customers/${exportData.customer_id}/constructions/${exportData.construction_id}/reports/air/${formId}`
                                                )}
                                                disabled={!formId}
                                                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                            >
                                                <Pencil className="h-4 w-4 mr-2" /> {t('exportDetails.edit')}
                                            </button>
                                            <button
                                                onClick={() => formId && handleDownloadReport(formId)}
                                                disabled={!formId || downloadingFormId === formId}
                                                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-border rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                                            >
                                                {downloadingFormId === formId ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Download className="h-4 w-4 mr-2" /> {t('exportDetails.download')}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="w-10 px-6 py-3">
                                    <input
                                        type="checkbox"
                                        className="rounded border-input text-primary focus:ring-ring"
                                        checked={
                                            forms.length > 0 &&
                                            selectedIds.size === forms.filter(f => f.form_id || f.report_form?.id).length
                                        }
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="w-10 px-6 py-3"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.ordinal')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.type')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.satisfies')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.dionica')}
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.action')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {forms.map((item, index) => {
                                const formId = item.form_id || item.report_form?.id;
                                const isSelected = formId ? selectedIds.has(formId) : false;
                                const displayOrdinal = item.ordinal && item.ordinal > 0 ? item.ordinal : index + 1;
                                return (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-muted/50 transition-colors cursor-move"
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(index)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="rounded border-input text-primary focus:ring-ring"
                                                checked={isSelected}
                                                onChange={() => formId && toggleSelect(formId)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground cursor-grab active:cursor-grabbing">
                                            <GripVertical className="h-4 w-4" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            #{displayOrdinal}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            {item.type_id === 1 ? t('exportDetails.water') : t('exportDetails.air')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.report_form?.satisfies
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                                }`}>
                                                {item.report_form?.satisfies ? t('common.yes') : t('common.no')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {item.report_form?.dionica || item.report_form?.stock || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button
                                                onClick={() => formId && navigate(item.type_id === 1
                                                    ? `/customers/${exportData.customer_id}/constructions/${exportData.construction_id}/reports/${formId}`
                                                    : `/customers/${exportData.customer_id}/constructions/${exportData.construction_id}/reports/air/${formId}`
                                                )}
                                                disabled={!formId}
                                                className="text-muted-foreground hover:text-foreground inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                title="Edit report"
                                            >
                                                <Pencil className="h-4 w-4 mr-1" /> {t('exportDetails.edit')}
                                            </button>
                                            <button
                                                onClick={() => formId && handleDownloadReport(formId)}
                                                disabled={!formId || downloadingFormId === formId}
                                                className="text-primary hover:text-primary/80 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {downloadingFormId === formId ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t('exportDetails.downloading')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-4 w-4 mr-1" /> {t('exportDetails.download')}
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
