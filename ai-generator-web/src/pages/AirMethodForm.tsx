import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Loader2, Save, ArrowLeft, FileDown, Plus, ArrowRight, ChevronLeft, Check, X, ChevronUp } from 'lucide-react';
import { Stepper } from '../components/ui/Stepper';
import * as calc from '../lib/calculations/report';
import type { ReportForm, ExaminationProcedure, ReportDraft, MaterialType, Material } from '../types';
import { cn } from '../lib/utils';
import { formatTime } from '../lib/calculations/testTime';
import { getAirTestRequirements, type AirTestMethod, type PipeMaterial } from '../lib/calculations/airTable';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// Dynamic import for PDF generation to reduce initial bundle size
const generatePDF = async (report: Partial<ReportForm>, userProfile?: any) => {
    const { generatePDF: gen } = await import('../lib/pdfGenerator');
    return gen(report, userProfile);
};

// Initial empty state
const initialState: Partial<ReportForm> = {
    type_id: 2, // Air
    draft_id: 1,
    material_type_id: 1, // Shaft
    examination_procedure_id: 1, // LA
    pipe_material_id: 0,
    dionica: '',
    temperature: 0,
    pipe_length: 0,
    pipe_diameter: 0,
    pane_width: 0,
    pane_length: 0,
    pressure_start: 0,
    pressure_end: 0,
    pane_diameter: 0,
    pane_height: 0,
    satisfies: false,
    examination_date: new Date().toISOString().split('T')[0],
    examination_start_time: '',
    examination_end_time: '',
    stabilization_time: '',
};

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
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ReportForm>>(initialState);
    const [procedures, setProcedures] = useState<ExaminationProcedure[]>([]);
    const [drafts, setDrafts] = useState<ReportDraft[]>([]);
    const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [step, setStep] = useState<1 | 2>(1);
    const [showMobileResults, setShowMobileResults] = useState(false);

    // Memoized calculations to prevent recalculation on every render
    const calculated = useMemo<CalculatedResults>(() => {
        const selectedProcedure = procedures.find(p => p.id === formData.examination_procedure_id);

        // Diameter logic: Always use shaft diameter (pane_diameter) for test time
        // Schema A (Draft 1): Shaft only - halve the time
        // Schema B (Draft 2/3): Shaft + Pipeline - full time
        const diameterMm = formData.pane_diameter || 0;

        let procedureId = 1;
        if (selectedProcedure) {
            procedureId = selectedProcedure.id;
        } else {
            const p = formData.pressure_start || 0;
            if (p >= 200) procedureId = 4;
            else if (p >= 100) procedureId = 3;
            else if (p >= 50) procedureId = 2;
        }

        const selectedMaterial = materials.find(m => m.id === formData.pipe_material_id);
        const isConcrete = selectedMaterial
            ? (selectedMaterial.name.toLowerCase().includes('beton') || selectedMaterial.name.toLowerCase().includes('concrete'))
            : true; // Default to concrete if not selected

        // Map ID to Method
        const methodMap: Record<number, AirTestMethod> = {
            1: 'LA',
            2: 'LB',
            3: 'LC',
            4: 'LD'
        };
        const method = methodMap[procedureId] || 'LA';
        const materialKey: PipeMaterial = isConcrete ? 'CONCRETE' : 'OTHER';

        // Get requirements from table
        const requirements = getAirTestRequirements(method, materialKey, diameterMm);

        // Shaft logic: Halve the time if it's a shaft test (Draft 1)
        let finalTime = requirements.requiredTime;
        if (formData.draft_id === 1) {
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

    const loadLookups = useCallback(async () => {
        const [procRes, draftRes, matTypeRes, materialsRes] = await Promise.all([
            supabase.from('examination_procedures').select('*').order('id'),
            supabase.from('report_drafts').select('*').order('id'),
            supabase.from('material_types').select('*').order('id'),
            supabase.from('materials').select('*').order('id')
        ]);

        if (procRes.data) setProcedures(procRes.data);
        if (draftRes.data) setDrafts(draftRes.data);
        if (matTypeRes.data) setMaterialTypes(matTypeRes.data);
        if (materialsRes.data) {
            setMaterials(materialsRes.data);
            // Set default material to 'Ostale cijevi' if not set
            if (!formData.pipe_material_id) {
                const defaultMat = materialsRes.data.find(m => m.name.toLowerCase().includes('ostale cijevi'));
                if (defaultMat) {
                    setFormData(prev => ({ ...prev, pipe_material_id: defaultMat.id }));
                }
            }
        }

    }, [formData.pipe_material_id]);

    const loadReport = useCallback(async (reportId: string) => {
        try {
            setLoading(true);
            const data = await reportService.getById(reportId);
            setFormData(data);
        } catch (error) {
            console.error('Error loading report:', error);
            alert(t('reports.form.loadError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadLookups();
        if (id && id !== 'new') {
            loadReport(id);
        }
    }, [id, loadLookups, loadReport]);

    // Effect to enforce Round Shafts for Air Method
    useEffect(() => {
        if (formData.draft_id === 1 && formData.material_type_id !== 1) {
            setFormData(prev => ({ ...prev, material_type_id: 1 }));
        }
    }, [formData.draft_id, formData.material_type_id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number | boolean = value;

        if (type === 'number') {
            finalValue = parseFloat(value) || 0;
        } else if (['draft_id', 'material_type_id', 'examination_procedure_id', 'pipe_material_id'].includes(name)) {
            finalValue = parseInt(value, 10) || 0;
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const saveReport = async (shouldRedirect: boolean) => {
        if (!formData.dionica) {
            alert(t('reports.form.dionicaRequired'));
            return;
        }

        try {
            setLoading(true);
            const dataToSave = {
                ...formData,
                satisfies: calculated.satisfies,
                allowed_loss: calculated.allowedLoss,
                pressure_loss: calculated.pressureLoss,
                required_test_time: calculated.requiredTestTime,
                customer_id: (customerId && customerId !== 'undefined') ? customerId : (formData.customer_id || undefined),
                construction_id: (constructionId && constructionId !== 'undefined') ? constructionId : (formData.construction_id || undefined),
                type_id: 2
            };

            if (!id || id === 'new' || id === 'undefined') {
                await reportService.create(dataToSave as ReportForm);
            } else {
                await reportService.update(id, dataToSave as ReportForm);
            }

            if (!shouldRedirect) {
                setFormData({
                    ...initialState,
                    customer_id: dataToSave.customer_id,
                    construction_id: dataToSave.construction_id,
                    examination_date: dataToSave.examination_date,
                    examination_procedure_id: dataToSave.examination_procedure_id,
                    draft_id: dataToSave.draft_id,
                    material_type_id: dataToSave.material_type_id,
                    dionica: '', // Reset dionica for new report
                });
                setStep(1);
                navigate(`/customers/${customerId}/constructions/${constructionId}/reports/new/air`);
                alert(t('reports.form.saveSuccess'));
            } else {
                if (customerId && constructionId) {
                    navigate(`/customers/${customerId}/constructions/${constructionId}/reports`);
                } else {
                    navigate('/reports');
                }
            }
        } catch (error) {
            console.error('Error saving report:', error);
            alert(t('reports.form.saveError'));
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

    const isShaftRound = formData.material_type_id === 1;
    const isShaftRectangular = formData.material_type_id === 2;
    // Show pipe fields for Schema B (Draft 2), Schema C (Draft 3), and Schema E (Draft 5)
    // Hide for Schema A (Draft 1) and Schema D (Draft 4)
    const showPipeFields = formData.draft_id === 2 || formData.draft_id === 3 || formData.draft_id === 5;

    if (loading && id && id !== 'new') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8 pb-24 lg:pb-0">
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
                                        {procedures.map(p => (
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
                                <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.structureType')}</h3>
                                <div className="space-y-4">
                                    <Select
                                        label={t('reports.form.draftType')}
                                        name="draft_id"
                                        value={formData.draft_id}
                                        onChange={handleChange}
                                    >
                                        {drafts.length === 0 && <option value={1}>{t('reports.form.shaftOnly')}</option>}
                                        {drafts.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </Select>
                                    <Select
                                        label={t('reports.form.materialType')}
                                        name="material_type_id"
                                        value={formData.material_type_id}
                                        onChange={handleChange}
                                        disabled={formData.draft_id === 1} // Disable for Shaft Only
                                    >
                                        {materialTypes.length === 0 && <option value={1}>{t('reports.form.round')}</option>}
                                        {materialTypes
                                            .filter(m => formData.draft_id === 1 ? m.id === 1 : true) // Only show Round for Shaft
                                            .map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                    </Select>
                                    <Select
                                        label={t('reports.form.pipeMaterial')}
                                        name="pipe_material_id"
                                        value={formData.pipe_material_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">{t('reports.form.selectMaterial')}</option>
                                        {materials
                                            .filter(m => ['suhe betonske cijevi', 'ostale cijevi'].includes(m.name.toLowerCase()))
                                            .map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                    </Select>
                                </div>
                            </div>

                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.dimensions')}</h3>
                                <div className="space-y-4">
                                    {isShaftRound && (
                                        <Input
                                            label={t('reports.form.paneDiameterMm')}
                                            type="number"
                                            name="pane_diameter"
                                            value={formData.pane_diameter}
                                            onChange={handleChange}
                                        />
                                    )}
                                    {isShaftRectangular && (
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
                                    <Input
                                        label={t('reports.form.stabilizationTime')}
                                        type="text"
                                        name="stabilization_time"
                                        value={formData.stabilization_time}
                                        onChange={handleChange}
                                        placeholder="00:00"
                                    />
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
