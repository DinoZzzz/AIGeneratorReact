import { useEffect, useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { historyService } from '../services/historyService';
import type { ReportExport, ReportExportForm, ReportForm } from '../types';
import type { ExportMetaData } from '../components/ExportDialog';
import { Loader2, ArrowLeft, Download, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { ReportFile } from '../types';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { reportService } from '../services/reportService';
import { ReportList } from '../components/history/ReportList';
import { AttachmentsGallery } from '../components/history/AttachmentsGallery';
import { useHandleError } from '../hooks/useHandleError';
import { errorHandler } from '../lib/errorHandler';

export const HistoryDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { t } = useLanguage();
    const handleError = useHandleError();
    const [exportData, setExportData] = useState<ReportExport | null>(null);
    const [forms, setForms] = useState<ReportExportForm[]>([]);

    const [loading, setLoading] = useState(true);
    const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
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
                handleError(error, 'HistoryDetails');
                navigate('/history');
            } finally {
                setLoading(false);
            }

        };
        loadData();
    }, [handleError, id, navigate]);

    const handleDownloadReport = async (formId: string) => {
        if (!exportData) return;

        setActionMessage({ text: t('exportDetails.downloading'), type: 'info' });
        setDownloadingFormId(formId);
        try {
            const { data: reportData, error } = await supabase
                .from('report_forms')
                .select('*')
                .eq('id', formId)
                .single();

            if (error) throw error;
            if (!reportData) throw new Error('Report not found');

            const { generatePDF } = await import('../lib/pdfGenerator');
            generatePDF(reportData, profile || undefined);
            setActionMessage(null);
        } catch (error) {
            setActionMessage({ text: errorHandler.getUserMessage(errorHandler.handle(error, 'HistoryDetails')), type: 'error' });
        } finally {
            setDownloadingFormId(null);
        }
    };

    const handleBulkExport = async () => {
        if (forms.length === 0 || !exportData) return;

        setIsExporting(true);
        setActionMessage({ text: t('exportDetails.generatingPdf'), type: 'info' });
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

            const { generateBulkPDF } = await import('../lib/pdfGenerator');
            generateBulkPDF(orderedReports, `${exportData.construction_part}_Reports.pdf`, profile || undefined);
            setActionMessage(null);
        } catch (error) {
            setActionMessage({ text: errorHandler.getUserMessage(errorHandler.handle(error, 'HistoryDetails')), type: 'error' });
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

            const { generateWordDocument } = await import('../services/wordExportService');
            await generateWordDocument(orderedReports, metaData);
            setActionMessage(null);
        } catch (error) {
            setActionMessage({ text: errorHandler.getUserMessage(errorHandler.handle(error, 'HistoryDetails')), type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const toggleSelectAll = () => {
        const allIds = forms
            .filter(f => !f.report_form?.section_name)
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

    const formatName = (p?: { name?: string; last_name?: string; email?: string }) => {
        if (!p) return undefined;
        const full = [p.name, p.last_name].filter(Boolean).join(' ').trim();
        return full || p.email;
    };

    const handleNavigateToReport = (formId: string, typeId: number) => {
        if (!exportData) return;
        navigate(typeId === 1
            ? `/customers/${exportData.customer_id}/constructions/${exportData.construction_id}/reports/${formId}`
            : `/customers/${exportData.customer_id}/constructions/${exportData.construction_id}/reports/air/${formId}`
        );
    };

    const firstWaterRemark = forms.find(f => f.type_id === 1)?.report_form?.remark;
    const firstWaterDeviation = forms.find(f => f.type_id === 1)?.report_form?.deviation;
    const firstAirRemark = forms.find(f => f.type_id === 2)?.report_form?.remark;
    const firstAirDeviation = forms.find(f => f.type_id === 2)?.report_form?.deviation;
    const anyRemark = forms.find(f => f.report_form?.remark)?.report_form?.remark;
    const anyDeviation = forms.find(f => f.report_form?.deviation)?.report_form?.deviation;

    const waterRemark = exportData ? (exportData.water_remark || firstWaterRemark || anyRemark || '-') : '-';
    const waterDeviation = exportData ? (exportData.water_deviation || firstWaterDeviation || anyDeviation || '-') : '-';
    const airRemark = exportData ? (exportData.air_remark || firstAirRemark || anyRemark || '-') : '-';
    const airDeviation = exportData ? (exportData.air_deviation || firstAirDeviation || anyDeviation || '-') : '-';

    const waterForms = forms.filter(f => f.type_id === 1).sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0));
    const airForms = forms.filter(f => f.type_id === 2).sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0));

    const handleDragEnd = async (event: DragEndEvent, typeId: 1 | 2) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const currentList = (typeId === 1 ? waterForms : airForms);

        const oldIndex = currentList.findIndex((r) => (r.form_id || r.report_form?.id) === active.id);
        const newIndex = currentList.findIndex((r) => (r.form_id || r.report_form?.id) === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newOrderedList = arrayMove(currentList, oldIndex, newIndex);

        const updatedList = newOrderedList.map((item, index) => ({
            ...item,
            ordinal: index + 1
        }));

        const otherForms = forms.filter(f => f.type_id !== typeId);
        const newForms = [...otherForms, ...updatedList];

        setForms(newForms);

        try {
            const reportsToUpdate = updatedList
                .filter(f => f.report_form)
                .map(f => ({
                    ...f.report_form!,
                    ordinal: f.ordinal
                }));

            await reportService.updateOrder(reportsToUpdate);
        } catch (error) {
            handleError(error, 'HistoryDetails');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!exportData) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/history')}
                        className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Go back to history"
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

            <AttachmentsGallery reportFiles={reportFiles} t={t} />

            {/* Included Reports Actions */}
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
            </div>

            {/* Water Reports */}
            <ReportList
                reportList={waterForms}
                title={`${t('exportDetails.water')} ${t('exportDetails.report')}`}
                typeId={1}
                selectedIds={selectedIds}
                downloadingFormId={downloadingFormId}
                onToggleSelect={toggleSelect}
                onSetSelectedIds={setSelectedIds}
                onDownloadReport={handleDownloadReport}
                onNavigateToReport={handleNavigateToReport}
                onDragEnd={handleDragEnd}
                t={t}
            />

            {/* Air Reports */}
            <ReportList
                reportList={airForms}
                title={`${t('exportDetails.air')} ${t('exportDetails.report')}`}
                typeId={2}
                selectedIds={selectedIds}
                downloadingFormId={downloadingFormId}
                onToggleSelect={toggleSelect}
                onSetSelectedIds={setSelectedIds}
                onDownloadReport={handleDownloadReport}
                onNavigateToReport={handleNavigateToReport}
                onDragEnd={handleDragEnd}
                t={t}
            />
        </div>
    );
};
