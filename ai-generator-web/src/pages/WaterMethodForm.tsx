import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Loader2, ArrowLeft, FileDown, Plus } from 'lucide-react';
import { Stepper } from '../components/ui/Stepper';
import type { ReportForm, ReportDraft, MaterialType, Material } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
    ParametersStep,
    MeasurementsStep,
    MobileResultsDrawer,
    useWaterCalculations
} from './water-method';

// Dynamic import for PDF generation to reduce initial bundle size
const generatePDF = async (report: Partial<ReportForm>, userProfile?: any) => {
    const { generatePDF: gen } = await import('../lib/pdfGenerator');
    return gen(report, userProfile);
};

// Initial empty state
const initialState: Partial<ReportForm> = {
    type_id: 1, // Water
    draft_id: 1,
    dionica: '',
    material_type_id: 1, // Shaft
    pane_material_id: 1,
    pipe_material_id: 1,
    temperature: 0,
    pipe_length: 0,
    pipe_diameter: 0,
    pane_width: 0,
    pane_length: 0,
    pane_height: 0,
    water_height: 0,
    water_height_start: 0,
    water_height_end: 0,
    pressure_start: 0,
    pressure_end: 0,
    pane_diameter: 0,
    ro_height: 0,
    depositional_height: 0,
    pipeline_slope: 0,
    examination_date: new Date().toISOString().split('T')[0],
    examination_duration: '00:30:00', // Default 30 minutes
    saturation_time: '01:00:00', // Default 1 hour
};

export const WaterMethodForm = () => {
    const { id, customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ReportForm>>(initialState);
    const [drafts, setDrafts] = useState<ReportDraft[]>([]);
    const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [step, setStep] = useState<1 | 2>(1);
    const [dionicaError, setDionicaError] = useState<string>('');
    const [showMobileResults, setShowMobileResults] = useState(false);

    // Use the extracted calculations hook
    const calculated = useWaterCalculations(formData);

    // Auto-fill deviation text based on schema conditions
    useEffect(() => {
        // Auto-fill deviation text for Schema C when hydrostatic height < 100cm
        if (formData.draft_id === 2 && calculated.hydrostaticHeight < 1.0) {
            const autoText = "Kod pojedinih dionica h2<100cm";
            if (formData.deviation !== autoText) {
                setFormData(prev => ({ ...prev, deviation: autoText }));
            }
        }

        // Auto-fill deviation text for Schema B when water height <= 100cm
        if (formData.draft_id === 3 && (formData.water_height || 0) <= 100) {
            const autoText = "Kod pojedinih dionica h2<100cm";
            if (formData.deviation !== autoText) {
                setFormData(prev => ({ ...prev, deviation: autoText }));
            }
        }
    }, [formData.draft_id, formData.water_height, calculated.hydrostaticHeight, formData.deviation]);

    const loadLookups = useCallback(async () => {
        const [draftRes, matTypeRes, matRes] = await Promise.all([
            supabase.from('report_drafts').select('*').order('id'),
            supabase.from('material_types').select('*').order('id'),
            supabase.from('materials').select('*').order('name')
        ]);

        if (draftRes.data) setDrafts(draftRes.data);
        if (matTypeRes.data) setMaterialTypes(matTypeRes.data);
        if (matRes.data) setMaterials(matRes.data);
    }, []);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number | boolean = value;

        if (type === 'number') {
            finalValue = parseFloat(value) || 0;
        } else if (['draft_id', 'material_type_id', 'pane_material_id', 'pipe_material_id'].includes(name)) {
            finalValue = parseInt(value, 10) || 0;
        }

        if (name === 'dionica' && dionicaError) {
            setDionicaError('');
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const saveReport = async (shouldRedirect: boolean) => {
        try {
            setLoading(true);
            if (!formData.dionica?.trim()) {
                setDionicaError(t('reports.form.dionicaRequired'));
                setStep(1);
                setLoading(false);
                return;
            }
            // Only save 'satisfies' from calculated - all other fields are display-only
            // Remove id from formData to avoid sending undefined id when creating
            const { id: formId, ...formDataWithoutId } = formData;
            const dataToSave = {
                ...formDataWithoutId,
                satisfies: calculated.satisfies,
                customer_id: customerId || formData.customer_id,
                construction_id: constructionId || formData.construction_id,
                type_id: 1
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
                });
                setStep(1);
                navigate(`/customers/${customerId}/constructions/${constructionId}/reports/new/water`);
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

    if (loading && id && id !== 'new') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8 pb-24 lg:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
                        <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {id === 'new' ? t('reports.form.waterTitleNew') : t('reports.form.editTitle')}
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

            {/* Stepper */}
            <Stepper
                steps={[t('reports.form.stepper.parameters'), t('reports.form.stepper.measurements')]}
                currentStep={step - 1}
                onStepClick={(s) => setStep((s + 1) as 1 | 2)}
            />

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                    <ParametersStep
                        formData={formData}
                        drafts={drafts}
                        materialTypes={materialTypes}
                        materials={materials}
                        dionicaError={dionicaError}
                        onChange={handleChange}
                        onNext={() => setStep(2)}
                        t={t}
                    />
                )}

                {step === 2 && (
                    <MeasurementsStep
                        formData={formData}
                        calculated={calculated}
                        onChange={handleChange}
                        onPrevious={() => setStep(1)}
                        t={t}
                    />
                )}
            </form>

            {/* Mobile Results FAB & Drawer (Only in Step 2) */}
            {step === 2 && (
                <MobileResultsDrawer
                    formData={formData}
                    calculated={calculated}
                    showMobileResults={showMobileResults}
                    setShowMobileResults={setShowMobileResults}
                    t={t}
                />
            )}
        </div>
    );
};
