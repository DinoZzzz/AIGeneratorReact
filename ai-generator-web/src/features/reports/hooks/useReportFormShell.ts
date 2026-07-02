import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Profile, ReportForm } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { errorHandler } from '../../../lib/errorHandler';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import {
    useCreateReport,
    useReport,
    useReportsByConstruction,
    useUpdateReport
} from '../../../hooks/useReports';

// String/non-numeric fields that should NOT be coerced to 0
const STRING_FIELDS = new Set([
    'id', 'user_id', 'customer_id', 'construction_id',
    'dionica', 'section_name', 'stock', 'remark', 'deviation',
    'examination_date', 'examination_duration', 'examination_start_time',
    'examination_end_time', 'saturation_time', 'stabilization_time',
    'created_at', 'updated_at',
]);

export const sanitizeForDb = (data: Record<string, unknown>) => {
    const sanitized = { ...data };
    for (const key of Object.keys(sanitized)) {
        if (sanitized[key] === '' && !STRING_FIELDS.has(key)) {
            sanitized[key] = 0;
        }
    }
    return sanitized;
};

// Dynamic import for PDF generation to reduce initial bundle size
export const generateReportPDF = async (report: Partial<ReportForm>, userProfile?: Profile) => {
    const { generatePDF: gen } = await import('../../../lib/pdfGenerator');
    return gen(report, userProfile);
};

export interface UseReportFormShellOptions {
    /** Route segment and autosave-key prefix for this method. */
    methodPath: 'water' | 'air';
    /** report_forms.type_id for this method (1 = water, 2 = air). */
    typeId: 1 | 2;
    /** Context string for errorHandler reporting. */
    errorContext: string;
    formData: Partial<ReportForm>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<ReportForm>>>;
    /** Fields copied from the previous report by "copy structure". Falsy values keep the current ones. */
    copyStructureFields: readonly (keyof ReportForm)[];
    /** Extra method-specific fields to prefill from the construction's last report of this type. */
    prefillExtraFromPrevious?: (lastReport: ReportForm) => Partial<ReportForm>;
    /** Called when route params change (reset method-specific refs). */
    onSectionParamsChange?: () => void;
    /** Called after a loaded report has been applied in edit mode. */
    onLoadedReport?: () => void;
}

/**
 * Everything the water/air report forms share around their method-specific
 * calculations and fields: routing params, report/draft data hooks, autosave
 * with restore banner, duplicate-source and previous-report prefill, and
 * navigation handlers.
 */
export function useReportFormShell({
    methodPath,
    typeId,
    errorContext,
    formData,
    setFormData,
    copyStructureFields,
    prefillExtraFromPrevious,
    onSectionParamsChange,
    onLoadedReport,
}: UseReportFormShellOptions) {
    const { id, customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { profile } = useAuth();
    const { success: showSuccess, error: showError } = useToast();

    const isEditMode = Boolean(id && id !== 'new' && id !== 'undefined');
    const reportId = isEditMode ? id! : '';
    const { data: loadedReport, isLoading: isReportLoading, error: reportLoadError } = useReport(reportId);
    const {
        data: constructionReports = [],
        error: constructionReportsError
    } = useReportsByConstruction(constructionId || '');
    const createReportMutation = useCreateReport();
    const updateReportMutation = useUpdateReport();
    const [searchParams] = useSearchParams();
    const duplicateId = searchParams.get('duplicate');
    const { data: duplicateSource } = useReport(duplicateId || '');

    const [step, setStep] = useState<1 | 2>(1);
    const [showMobileResults, setShowMobileResults] = useState(false);
    const [hasUserEdited, setHasUserEdited] = useState(false);
    const initializedFromPreviousRef = useRef(false);
    const initializedFromDuplicateRef = useRef(false);

    // Latest-value refs so the per-method callbacks don't retrigger effects.
    // Updated in an effect (not during render); this effect is declared before
    // every consumer, so the refs are current by the time consumers run.
    const prefillExtraRef = useRef(prefillExtraFromPrevious);
    const onSectionParamsChangeRef = useRef(onSectionParamsChange);
    const onLoadedReportRef = useRef(onLoadedReport);
    useEffect(() => {
        prefillExtraRef.current = prefillExtraFromPrevious;
        onSectionParamsChangeRef.current = onSectionParamsChange;
        onLoadedReportRef.current = onLoadedReport;
    });

    // Warn user when leaving page with unsaved changes
    useUnsavedChanges(hasUserEdited);

    // Auto-save drafts
    const autoSaveKey = `${methodPath}_${constructionId || 'unknown'}_${id || 'new'}`;
    const { restoredData, clearSavedData, lastSaved, dismissRestore } = useAutoSave(autoSaveKey, formData);

    // useAutoSave reads any saved draft synchronously on mount, so the banner
    // visibility can be decided right in the initializer.
    const [showRestoreBanner, setShowRestoreBanner] = useState(
        () => Boolean(restoredData) && !isEditMode && !duplicateId
    );

    const handleRestoreDraft = () => {
        if (restoredData) {
            setFormData(restoredData);
            showSuccess(t('form.draftRestored'));
        }
        setShowRestoreBanner(false);
        dismissRestore();
    };

    const handleDiscardDraft = () => {
        setShowRestoreBanner(false);
        clearSavedData();
        dismissRestore();
    };

    // Duplicate report handling
    useEffect(() => {
        if (duplicateSource && !initializedFromDuplicateRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _id, ordinal: _ord, created_at: _ca, updated_at: _ua, ...rest } = duplicateSource;
            setFormData(prev => ({
                ...prev,
                ...rest,
                examination_date: new Date().toISOString().split('T')[0],
            }));
            initializedFromDuplicateRef.current = true;
            showSuccess(t('form.duplicated'));
        }
    }, [duplicateSource]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (reportLoadError) {
            const appError = errorHandler.handle(reportLoadError, errorContext);
            showError(errorHandler.getUserMessage(appError));
        }
    }, [reportLoadError, showError, errorContext]);

    useEffect(() => {
        if (constructionReportsError) {
            errorHandler.handle(constructionReportsError, errorContext);
        }
    }, [constructionReportsError, errorContext]);

    useEffect(() => {
        if (isEditMode && loadedReport) {
            setFormData(loadedReport);
            onLoadedReportRef.current?.();
        }
    }, [isEditMode, loadedReport, setFormData]);

    useEffect(() => {
        initializedFromPreviousRef.current = false;
        onSectionParamsChangeRef.current?.();
    }, [constructionId, customerId, id]);

    // The construction's most recent full (non-section) reports, newest first:
    // previousReport (same method) drives "copy structure from previous" and
    // prefill; lastAnyTypeReport (either method) supplies the section name.
    const { previousReport, lastAnyTypeReport } = useMemo(() => {
        if (!constructionId || isEditMode) {
            return { previousReport: null, lastAnyTypeReport: null };
        }

        const normalizedCustomerId = customerId && customerId !== 'undefined' ? customerId : undefined;
        const candidateReports = constructionReports
            .filter((report) => !report.section_name)
            .filter((report) => !normalizedCustomerId || report.customer_id === normalizedCustomerId)
            .sort((a, b) => {
                const aTime = new Date(a.created_at || a.updated_at || a.examination_date || 0).getTime();
                const bTime = new Date(b.created_at || b.updated_at || b.examination_date || 0).getTime();
                return bTime - aTime;
            });

        return {
            previousReport: candidateReports.find((report) => report.type_id === typeId) ?? null,
            lastAnyTypeReport: candidateReports[0] ?? null,
        };
    }, [constructionId, constructionReports, customerId, isEditMode, typeId]);

    // Prefill a new report from the construction's most recent reports
    useEffect(() => {
        if (!constructionId || isEditMode || initializedFromPreviousRef.current) return;

        if (previousReport) {
            setFormData(prev => ({
                ...prev,
                dionica: lastAnyTypeReport?.dionica || lastAnyTypeReport?.stock || prev.dionica,
                examination_date: previousReport.examination_date || prev.examination_date,
                temperature: previousReport.temperature || prev.temperature,
                pane_material_id: previousReport.pane_material_id || prev.pane_material_id,
                pipe_material_id: previousReport.pipe_material_id || prev.pipe_material_id,
                ...prefillExtraRef.current?.(previousReport),
            }));
            initializedFromPreviousRef.current = true;
            return;
        }

        if (lastAnyTypeReport?.dionica || lastAnyTypeReport?.stock) {
            setFormData(prev => ({
                ...prev,
                dionica: lastAnyTypeReport.dionica || lastAnyTypeReport.stock || prev.dionica
            }));
        }

        initializedFromPreviousRef.current = true;
    }, [constructionId, isEditMode, previousReport, lastAnyTypeReport, setFormData]);

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            if (customerId && constructionId) {
                navigate(`/customers/${customerId}/constructions/${constructionId}/reports`);
            } else {
                navigate('/reports');
            }
        }
    };

    // Copy structure fields from the previous report; falsy values keep current
    const copyStructureFromPrevious = () => {
        if (!previousReport) return;
        setFormData(prev => {
            const next: Record<string, unknown> = { ...prev };
            for (const field of copyStructureFields) {
                const value = previousReport[field];
                if (value) {
                    next[field] = value;
                }
            }
            return next as Partial<ReportForm>;
        });
    };

    return {
        // routing
        id, customerId, constructionId, navigate,
        // shared contexts
        t, profile, showSuccess, showError,
        // report data
        isEditMode, reportId, loadedReport, isReportLoading, constructionReports,
        createReportMutation, updateReportMutation,
        // ui state
        step, setStep, showMobileResults, setShowMobileResults,
        previousReport, hasUserEdited, setHasUserEdited,
        // autosave / drafts
        showRestoreBanner, lastSaved, clearSavedData, handleRestoreDraft, handleDiscardDraft,
        // actions
        handleBack, copyStructureFromPrevious,
    };
}
