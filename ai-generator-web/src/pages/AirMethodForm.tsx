import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Loader2, Save, ArrowLeft, FileDown, Plus, ArrowRight, ChevronLeft, Check, X, ChevronUp, Copy } from 'lucide-react';
import { Stepper } from '../components/ui/Stepper';
import * as calc from '../lib/calculations/report';
import type { ReportForm, ExaminationProcedure, ReportDraft, MaterialType, Material, Profile } from '../types';
import { cn } from '../lib/utils';
import { formatTime } from '../lib/calculations/testTime';
import { getAirTestRequirements, type AirTestMethod, type PipeMaterial } from '../lib/calculations/airTable';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorHandler } from '../lib/errorHandler';
import { getLookupWithOfflineFallback } from '../lib/offlineLookupCache';
import { useAutoSave } from '../hooks/useAutoSave';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import {
    useCreateReport,
    useReport,
    useReportsByConstruction,
    useUpdateReport
} from '../hooks/useReports';

// Dynamic import for PDF generation to reduce initial bundle size
const generatePDF = async (report: Partial<ReportForm>, userProfile?: Profile) => {
    const { generatePDF: gen } = await import('../lib/pdfGenerator');
    return gen(report, userProfile);
};

// Numeric fields that should be coerced from '' to 0 before saving to DB
const NUMERIC_FIELDS: (keyof ReportForm)[] = [
    'temperature', 'pipe_length', 'pipe_diameter', 'pane_width', 'pane_length',
    'pane_height', 'pressure_start', 'pressure_end', 'pane_diameter',
];

const sanitizeNumericFields = (data: Record<string, unknown>) => {
    const sanitized = { ...data };
    for (const key of NUMERIC_FIELDS) {
        if (sanitized[key] === '' || sanitized[key] === undefined) {
            sanitized[key] = 0;
        }
    }
    return sanitized;
};

// Initial empty state
const initialState: Partial<ReportForm> = {
    type_id: 2, // Air
    draft_id: 1,
    material_type_id: 1, // Shaft
    examination_procedure_id: 1, // LA
    pane_material_id: 1,
    pipe_material_id: 0,
    dionica: '',
    temperature: '' as unknown as number,
    pipe_length: '' as unknown as number,
    pipe_diameter: '' as unknown as number,
    pane_width: '' as unknown as number,
    pane_length: '' as unknown as number,
    pressure_start: '' as unknown as number,
    pressure_end: '' as unknown as number,
    pane_diameter: '' as unknown as number,
    pane_height: '' as unknown as number,
    satisfies: false,
    examination_date: new Date().toISOString().split('T')[0],
    examination_start_time: '',
    examination_end_time: '',
    stabilization_time: '5', // Default 5 minutes
};

const AIR_DRAFT_SHAFT_ONLY = 1;
const AIR_DRAFT_PIPE_ONLY = 2;
const AIR_DRAFT_SHAFT_AND_PIPE = 3;
const AIR_ALLOWED_DRAFT_IDS = [AIR_DRAFT_SHAFT_ONLY, AIR_DRAFT_PIPE_ONLY, AIR_DRAFT_SHAFT_AND_PIPE] as const;

interface CalculatedResults {
    pressureLoss: number;
    allowedLoss: number;
    satisfies: boolean;
    testTime: string;
    requiredTestTime: number; // in minutes
}

export const AirMethodForm = () => {
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
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ReportForm>>(initialState);
    const [procedures, setProcedures] = useState<ExaminationProcedure[]>([]);
    const [drafts, setDrafts] = useState<ReportDraft[]>([]);
    const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [step, setStep] = useState<1 | 2>(1);
    const [showMobileResults, setShowMobileResults] = useState(false);
    const [previousReport, setPreviousReport] = useState<ReportForm | null>(null);
    const [showRestoreBanner, setShowRestoreBanner] = useState(false);
    const [hasUserEdited, setHasUserEdited] = useState(false);
    const initializedFromPreviousRef = useRef(false);
    const initializedFromDuplicateRef = useRef(false);

    // Warn user when leaving page with unsaved changes
    useUnsavedChanges(hasUserEdited);

    // Auto-save drafts
    const autoSaveKey = `air_${constructionId || 'unknown'}_${id || 'new'}`;
    const { restoredData, clearSavedData, lastSaved, dismissRestore } = useAutoSave(autoSaveKey, formData);

    // Show restore banner on mount if there's saved data
    useEffect(() => {
        if (restoredData && !isEditMode && !duplicateId) {
            setShowRestoreBanner(true);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    const airDraftOptions = useMemo(() => {
        const draftLabelById = new Map(drafts.map((draft) => [draft.id, draft.name]));
        return [
            {
                id: AIR_DRAFT_PIPE_ONLY,
                label: draftLabelById.get(AIR_DRAFT_PIPE_ONLY) || (t('reports.form.airScheme1PipeOnly') || 'Shema 1 - Ispitivanje cjevovoda')
            },
            {
                id: AIR_DRAFT_SHAFT_AND_PIPE,
                label: draftLabelById.get(AIR_DRAFT_SHAFT_AND_PIPE) || (t('reports.form.airScheme2ShaftPipe') || 'Shema 2 - Ispitivanje okna i cjevovoda')
            },
            {
                id: AIR_DRAFT_SHAFT_ONLY,
                label: draftLabelById.get(AIR_DRAFT_SHAFT_ONLY) || (t('reports.form.airScheme3ShaftOnly') || 'Shema 3 - Ispitivanje okna')
            }
        ];
    }, [drafts, t]);

    const isShaftOnlyDraft = formData.draft_id === AIR_DRAFT_SHAFT_ONLY;
    const isPipeOnlyDraft = formData.draft_id === AIR_DRAFT_PIPE_ONLY;
    const isShaftAndPipeDraft = formData.draft_id === AIR_DRAFT_SHAFT_AND_PIPE;
    const includesShaft = !isPipeOnlyDraft;

    const procedureOptions = useMemo(() => {
        if (!isShaftOnlyDraft) {
            return procedures;
        }

        return procedures.filter((procedure) => {
            const normalizedName = procedure.name?.toUpperCase().trim() || '';
            return normalizedName === 'LA' || normalizedName.includes('LA') || normalizedName === 'LB' || normalizedName.includes('LB');
        });
    }, [isShaftOnlyDraft, procedures]);

    // Memoized calculations to prevent recalculation on every render
    const calculated = useMemo<CalculatedResults>(() => {
        const selectedProcedure = procedures.find(p => p.id === formData.examination_procedure_id);

        // EN 1610: test time follows test method + pipe diameter.
        // Shaft-only tests (okno) use half time of a pipe with the same diameter.
        const usesPipeDiameter = formData.draft_id === AIR_DRAFT_PIPE_ONLY || formData.draft_id === AIR_DRAFT_SHAFT_AND_PIPE;
        const diameterMm = usesPipeDiameter
            ? (formData.pipe_diameter || formData.pane_diameter || 0)
            : (formData.pane_diameter || formData.pipe_diameter || 0);

        const selectedMaterial = materials.find(m => m.id === formData.pipe_material_id);
        const isConcrete = selectedMaterial
            ? (selectedMaterial.name.toLowerCase().includes('beton') || selectedMaterial.name.toLowerCase().includes('concrete'))
            : true; // Default to concrete if not selected

        // Get method from procedure name instead of assuming ID order
        // The procedure name should be 'LA', 'LB', 'LC', or 'LD'
        let method: AirTestMethod = 'LA';
        if (selectedProcedure?.name) {
            const procName = selectedProcedure.name.toUpperCase().trim();
            if (procName === 'LB' || procName.includes('LB')) method = 'LB';
            else if (procName === 'LC' || procName.includes('LC')) method = 'LC';
            else if (procName === 'LD' || procName.includes('LD')) method = 'LD';
            else if (procName === 'LA' || procName.includes('LA')) method = 'LA';
        }
        const materialKey: PipeMaterial = isConcrete ? 'CONCRETE' : 'OTHER';

        // Get requirements from table
        const requirements = getAirTestRequirements(method, materialKey, diameterMm);

        // Shaft-only logic: halve required time for revision shaft tests.
        let finalTime = requirements.requiredTime;
        if (formData.draft_id === AIR_DRAFT_SHAFT_ONLY) {
            finalTime = finalTime / 2;
        }

        const allowedLoss = requirements.allowedDrop;

        const results = calc.calculateAirReport(formData as ReportForm, allowedLoss);

        return {
            pressureLoss: results.pressureLoss,
            allowedLoss: allowedLoss,
            satisfies: results.satisfies,
            testTime: '00:00',
            requiredTestTime: finalTime
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        formData.examination_procedure_id,
        formData.pane_diameter,
        formData.pressure_start,
        formData.pressure_end,
        formData.pipe_material_id,
        formData.draft_id,
        procedures,
        materials
    ]);

    useEffect(() => {
        if (!formData.draft_id || AIR_ALLOWED_DRAFT_IDS.includes(formData.draft_id as typeof AIR_ALLOWED_DRAFT_IDS[number])) {
            return;
        }
        setFormData(prev => ({ ...prev, draft_id: AIR_DRAFT_SHAFT_ONLY }));
    }, [formData.draft_id]);

    useEffect(() => {
        if (procedureOptions.length === 0) return;
        const selectedProcedureIsValid = procedureOptions.some(
            (procedure) => procedure.id === formData.examination_procedure_id
        );
        if (selectedProcedureIsValid) return;

        setFormData(prev => ({
            ...prev,
            examination_procedure_id: procedureOptions[0].id
        }));
    }, [formData.examination_procedure_id, procedureOptions]);

    const loadLookups = useCallback(async () => {
        try {
            const [procData, draftData, matTypeData, materialsData] = await Promise.all([
                getLookupWithOfflineFallback<ExaminationProcedure>('examination_procedures', 'id'),
                getLookupWithOfflineFallback<ReportDraft>('report_drafts', 'id'),
                getLookupWithOfflineFallback<MaterialType>('material_types', 'id'),
                getLookupWithOfflineFallback<Material>('materials', 'id')
            ]);

            setProcedures(procData);
            setDrafts(draftData);
            setMaterialTypes(matTypeData);
            setMaterials(materialsData);

            if (!formData.pane_material_id) {
                const paneMats = materialsData.filter(m => m.material_type_id === 1);
                if (paneMats.length > 0) {
                    setFormData(prev => ({ ...prev, pane_material_id: paneMats[0].id }));
                }
            }
            if (!formData.pipe_material_id) {
                const pipeMaterials = materialsData.filter(m => m.material_type_id === 2);
                if (pipeMaterials.length > 0) {
                    setFormData(prev => ({ ...prev, pipe_material_id: pipeMaterials[0].id }));
                }
            }
        } catch (error) {
            const appError = errorHandler.handle(error, 'AirMethodForm');
            showError(errorHandler.getUserMessage(appError));
        }
    }, [formData.pipe_material_id, showError]);

    useEffect(() => {
        loadLookups();
    }, [loadLookups]);

    useEffect(() => {
        if (reportLoadError) {
            const appError = errorHandler.handle(reportLoadError, 'AirMethodForm');
            showError(errorHandler.getUserMessage(appError));
        }
    }, [reportLoadError, showError]);

    useEffect(() => {
        if (constructionReportsError) {
            errorHandler.handle(constructionReportsError, 'AirMethodForm');
        }
    }, [constructionReportsError]);

    useEffect(() => {
        if (isEditMode && loadedReport) {
            setFormData(loadedReport);
        }
    }, [isEditMode, loadedReport]);

    useEffect(() => {
        initializedFromPreviousRef.current = false;
        setPreviousReport(null);
    }, [constructionId, customerId, id]);

    useEffect(() => {
        if (!constructionId || isEditMode || initializedFromPreviousRef.current) return;

        const normalizedCustomerId = customerId && customerId !== 'undefined' ? customerId : undefined;
        const candidateReports = constructionReports
            .filter((report) => !report.section_name)
            .filter((report) => !normalizedCustomerId || report.customer_id === normalizedCustomerId)
            .sort((a, b) => {
                const aTime = new Date(a.created_at || a.updated_at || a.examination_date || 0).getTime();
                const bTime = new Date(b.created_at || b.updated_at || b.examination_date || 0).getTime();
                return bTime - aTime;
            });

        const lastAnyTypeReport = candidateReports[0];
        const lastReport = candidateReports.find((report) => report.type_id === 2);

        if (lastReport) {
            setPreviousReport(lastReport);
            setFormData(prev => ({
                ...prev,
                dionica: lastAnyTypeReport?.dionica || lastAnyTypeReport?.stock || prev.dionica,
                examination_date: lastReport.examination_date || prev.examination_date,
                temperature: lastReport.temperature || prev.temperature,
                examination_procedure_id: lastReport.examination_procedure_id || prev.examination_procedure_id,
                pane_material_id: lastReport.pane_material_id || prev.pane_material_id,
                pipe_material_id: lastReport.pipe_material_id || prev.pipe_material_id,
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
    }, [constructionId, constructionReports, customerId, isEditMode]);

    // Effect to enforce Round Shafts for Air Method
    useEffect(() => {
        if (formData.draft_id === AIR_DRAFT_SHAFT_ONLY && formData.material_type_id !== 1) {
            setFormData(prev => ({ ...prev, material_type_id: 1 }));
        }
    }, [formData.draft_id, formData.material_type_id]);

    // Effect to auto-populate examination_duration from EN 1610 table
    useEffect(() => {
        if (calculated.requiredTestTime > 0) {
            // Convert minutes to HH:MM:SS format
            const totalSeconds = Math.round(calculated.requiredTestTime * 60);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const durationStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            setFormData(prev => ({ ...prev, examination_duration: durationStr }));
        }
    }, [calculated.requiredTestTime]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number | boolean = value;

        if (type === 'number') {
            finalValue = value === '' ? '' : parseFloat(value);
        } else if (['draft_id', 'material_type_id', 'examination_procedure_id', 'pane_material_id', 'pipe_material_id'].includes(name)) {
            finalValue = parseInt(value, 10) || 0;
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
        setHasUserEdited(true);
    };

    const saveReport = async (shouldRedirect: boolean) => {
        // Prevent double-click/duplicate submissions
        if (loading) {
            return;
        }

        if (!formData.dionica) {
            showError(t('reports.form.dionicaRequired'));
            return;
        }

        try {
            setLoading(true);
            const dataToSave = sanitizeNumericFields({
                ...formData,
                satisfies: calculated.satisfies,
                allowed_loss: calculated.allowedLoss,
                pressure_loss: calculated.pressureLoss,
                required_test_time: calculated.requiredTestTime,
                customer_id: (customerId && customerId !== 'undefined') ? customerId : (formData.customer_id || undefined),
                construction_id: (constructionId && constructionId !== 'undefined') ? constructionId : (formData.construction_id || undefined),
                type_id: 2
            });

            if (!isEditMode) {
                await createReportMutation.mutateAsync(dataToSave as Partial<ReportForm>);
            } else {
                await updateReportMutation.mutateAsync({ id: reportId, report: dataToSave as Partial<ReportForm> });
            }

            clearSavedData();

            if (!shouldRedirect) {
                // Pre-fill new form with all data from saved report so user only tweaks what changed
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id: _savedId, ordinal: _ord, created_at: _ca, updated_at: _ua, satisfies: _sat, allowed_loss: _al, pressure_loss: _pl, required_test_time: _rtt, ...carryOver } = dataToSave;
                setFormData({
                    ...initialState,
                    ...carryOver,
                    // Reset measurement fields that are unique per section
                    pressure_start: '' as unknown as number,
                    pressure_end: '' as unknown as number,
                });
                setStep(1);
                navigate(`/customers/${customerId}/constructions/${constructionId}/reports/new/air`);
                showSuccess(t('reports.form.saveSuccess'));
            } else {
                if (customerId && constructionId) {
                    navigate(`/customers/${customerId}/constructions/${constructionId}/reports`);
                } else {
                    navigate('/reports');
                }
            }
        } catch (error) {
            const appError = errorHandler.handle(error, 'AirMethodForm');
            showError(errorHandler.getUserMessage(appError));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveReport(true);
    };

    const handleSaveAndNew = (e: React.MouseEvent) => {
        e.preventDefault();
        saveReport(false);
    };

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

    // Copy structure type from previous report
    const copyStructureFromPrevious = () => {
        if (previousReport) {
            setFormData(prev => ({
                ...prev,
                draft_id: previousReport.draft_id || prev.draft_id,
                material_type_id: previousReport.material_type_id || prev.material_type_id,
                pane_material_id: previousReport.pane_material_id || prev.pane_material_id,
                pane_diameter: previousReport.pane_diameter || prev.pane_diameter,
                pane_width: previousReport.pane_width || prev.pane_width,
                pane_length: previousReport.pane_length || prev.pane_length,
                pane_height: previousReport.pane_height || prev.pane_height,
                pipe_diameter: previousReport.pipe_diameter || prev.pipe_diameter,
                pipe_length: previousReport.pipe_length || prev.pipe_length,
            }));
        }
    };

    const paneMaterials = useMemo(
        () => materials.filter((material) => material.material_type_id === 1),
        [materials]
    );

    const isShaftRound = formData.material_type_id === 1;
    const isShaftRectangular = formData.material_type_id === 2;
    // Pipe dimensions are relevant for pipeline-only and shaft+pipeline tests.
    const showPipeFields = isPipeOnlyDraft || isShaftAndPipeDraft;

    if (isEditMode && isReportLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8 pb-24 lg:pb-0">
            {/* Auto-save restore banner */}
            {showRestoreBanner && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-sm text-blue-800 dark:text-blue-300">{t('form.draftFound')}</p>
                    <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={handleDiscardDraft}>
                            <X className="h-3 w-3 mr-1" />
                            {t('form.discardDraft')}
                        </Button>
                        <Button size="sm" onClick={handleRestoreDraft}>
                            <Check className="h-3 w-3 mr-1" />
                            {t('form.restoreDraft')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Auto-save indicator */}
            {lastSaved && !showRestoreBanner && (
                <p className="text-xs text-muted-foreground text-right">{t('form.autoSaved')}</p>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {id === 'new' ? t('reports.form.airTitleNew') : t('reports.form.editTitle')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {step === 1 ? t('reports.form.step1Desc') : t('reports.form.step2Desc')}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    {step === 2 && (
                        <>
                            <Button variant="outline" onClick={() => generatePDF(formData, profile || undefined)} className="hidden sm:flex">
                                <FileDown className="h-4 w-4 mr-2" />
                                {t('reports.form.exportPdf')}
                            </Button>
                            <Button variant="outline" onClick={handleSaveAndNew} className="hidden sm:flex">
                                <Plus className="h-4 w-4 mr-2" />
                                {t('reports.form.saveAndNew')}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Stepper
                steps={[t('reports.form.stepper.parameters'), t('reports.form.stepper.measurements')]}
                currentStep={step - 1}
                onStepClick={(s) => setStep((s + 1) as 1 | 2)}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.generalInfo')}</h3>
                                <div className="space-y-4">
                                    <Select
                                        label={t('reports.form.examProcedure')}
                                        name="examination_procedure_id"
                                        value={formData.examination_procedure_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">{t('reports.form.selectProcedure')}</option>
                                        {procedureOptions.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </Select>
                                    <Input
                                        label={t('reports.form.dionica')}
                                        name="dionica"
                                        value={formData.dionica || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        label={t('reports.form.examDate')}
                                        type="date"
                                        name="examination_date"
                                        value={formData.examination_date}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        label={t('reports.form.temperature')}
                                        type="number"
                                        step="0.1"
                                        name="temperature"
                                        value={formData.temperature}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-foreground">{t('reports.form.structureType')}</h3>
                                    {previousReport && (!id || id === 'new') && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={copyStructureFromPrevious}
                                            className="text-xs"
                                        >
                                            <Copy className="h-3 w-3 mr-1" />
                                            {t('reports.form.copyFromPrevious')}
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <Select
                                        label={t('reports.form.draftType')}
                                        name="draft_id"
                                        value={formData.draft_id}
                                        onChange={handleChange}
                                    >
                                        {airDraftOptions.map((draftOption) => (
                                            <option key={draftOption.id} value={draftOption.id}>
                                                {draftOption.label}
                                            </option>
                                        ))}
                                    </Select>
                                    {includesShaft && (
                                        <Select
                                            label={t('reports.form.materialType')}
                                            name="material_type_id"
                                            value={formData.material_type_id}
                                            onChange={handleChange}
                                            disabled={isShaftOnlyDraft}
                                        >
                                            {materialTypes.length === 0 && <option value={1}>{t('reports.form.round')}</option>}
                                            {materialTypes
                                                .filter(m => isShaftOnlyDraft ? m.id === 1 : true)
                                                .map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                        </Select>
                                    )}
                                    {includesShaft && (
                                        <Select
                                            label={t('reports.form.shaftMaterial')}
                                            name="pane_material_id"
                                            value={formData.pane_material_id || paneMaterials[0]?.id || ''}
                                            onChange={handleChange}
                                        >
                                            {paneMaterials.length > 0 ? (
                                                paneMaterials.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))
                                            ) : (
                                                <option value={1}>{t('reports.form.standardMaterial')}</option>
                                            )}
                                        </Select>
                                    )}
                                    <Select
                                        label={t('reports.form.pipeMaterial')}
                                        name="pipe_material_id"
                                        value={formData.pipe_material_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">{t('reports.form.selectMaterial')}</option>
                                        {materials
                                            .filter(m => m.material_type_id === 2)
                                            .map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                    </Select>
                                </div>
                            </div>

                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.dimensions')}</h3>
                                <div className="space-y-4">
                                    {includesShaft && isShaftRound && (
                                        <Input
                                            label={t('reports.form.paneDiameterMm')}
                                            type="number"
                                            name="pane_diameter"
                                            value={formData.pane_diameter}
                                            onChange={handleChange}
                                        />
                                    )}
                                    {includesShaft && isShaftRectangular && (
                                        <>
                                            <Input
                                                label={t('reports.form.paneWidthM')}
                                                type="number"
                                                step="0.01"
                                                name="pane_width"
                                                value={formData.pane_width}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label={t('reports.form.paneLengthM')}
                                                type="number"
                                                step="0.01"
                                                name="pane_length"
                                                value={formData.pane_length}
                                                onChange={handleChange}
                                            />
                                        </>
                                    )}
                                    {showPipeFields && (
                                        <>
                                            <Input
                                                label={t('reports.form.pipeDiameterMm')}
                                                type="number"
                                                name="pipe_diameter"
                                                value={formData.pipe_diameter}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label={t('reports.form.pipeLengthM')}
                                                type="number"
                                                step="0.01"
                                                name="pipe_length"
                                                value={formData.pipe_length}
                                                onChange={handleChange}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex justify-end">
                            <Button type="button" onClick={() => setStep(2)} size="lg" className="w-full sm:w-auto">
                                {t('reports.form.nextStep')} <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.pressureTime')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label={t('reports.form.startPressure')}
                                        type="number"
                                        step="0.01"
                                        name="pressure_start"
                                        value={formData.pressure_start}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        label={t('reports.form.endPressure')}
                                        type="number"
                                        step="0.01"
                                        name="pressure_end"
                                        value={formData.pressure_end}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        label={t('reports.form.startTime')}
                                        type="time"
                                        name="examination_start_time"
                                        value={formData.examination_start_time}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        label={t('reports.form.endTime')}
                                        type="time"
                                        name="examination_end_time"
                                        value={formData.examination_end_time}
                                        onChange={handleChange}
                                    />
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">{t('reports.form.stabilizationTime')}</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, stabilization_time: String(Math.max(0, parseInt(String(prev.stabilization_time || '5')) - 1)) }))}
                                                className="h-10 w-10 rounded-md border border-input bg-background flex items-center justify-center hover:bg-muted"
                                            >
                                                -
                                            </button>
                                            <Input
                                                type="number"
                                                name="stabilization_time"
                                                value={formData.stabilization_time || '5'}
                                                onChange={handleChange}
                                                className="text-center w-20"
                                                min="0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, stabilization_time: String(parseInt(String(prev.stabilization_time || '5')) + 1) }))}
                                                className="h-10 w-10 rounded-md border border-input bg-background flex items-center justify-center hover:bg-muted"
                                            >
                                                +
                                            </button>
                                            <span className="text-sm text-muted-foreground">min</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.remarksSection')}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">{t('reports.form.remarkLabel')}</label>
                                        <textarea
                                            name="remark"
                                            value={formData.remark || ''}
                                            onChange={handleChange}
                                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            placeholder={t('reports.form.remarkPlaceholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">{t('reports.form.deviationLabel')}</label>
                                        <textarea
                                            name="deviation"
                                            value={formData.deviation || ''}
                                            onChange={handleChange}
                                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            placeholder={t('reports.form.deviationPlaceholder')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-4">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} size="lg" className="w-full sm:w-auto">
                                    <ChevronLeft className="mr-2 h-5 w-5" /> {t('reports.form.prevStep')}
                                </Button>
                                <Button type="submit" size="lg" className="w-full sm:w-auto">
                                    <Save className="mr-2 h-4 w-4" />
                                    {t('reports.form.saveReport')}
                                </Button>
                            </div>
                        </div>

                        {/* Desktop Results Column */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="bg-card shadow-sm rounded-xl border border-border p-6 sticky top-6">
                                <h3 className="text-lg font-semibold text-foreground mb-6">{t('reports.form.calculatedResults')}</h3>

                                <div className="space-y-6">
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
                        </div>
                    </div>
                )}
            </form>

            {/* Mobile Results FAB & Drawer (Only in Step 2) */}
            {step === 2 && (
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
                                    <Button variant="ghost" size="icon" onClick={() => setShowMobileResults(false)} className="-mr-2">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="space-y-6">
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
            )}
        </div>
    );
};

const ResultRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div className="flex justify-between items-center">
        <span className={cn("text-sm", highlight ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
        <span className={cn("font-medium", highlight ? "text-lg text-primary" : "text-foreground")}>{value}</span>
    </div>
);
