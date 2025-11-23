import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Loader2, Save, ArrowLeft, FileDown, Plus, ArrowRight, ChevronLeft } from 'lucide-react';
import { Stepper } from '../components/ui/Stepper';
import * as calc from '../lib/calculations/report';
import { generatePDF } from '../lib/pdfGenerator';
import type { ReportForm, ReportDraft, MaterialType, Material } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

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

interface CalculatedResults {
    waterLoss: number;
    waterVolumeLoss: number;
    wettedShaftSurface: number;
    wettedPipeSurface: number;
    totalWettedArea: number;
    allowedLossL: number;
    allowedLossMm: number;
    hydrostaticHeight: number;
    result: number;
    satisfies: boolean;
}

export const WaterMethodForm = () => {
    const { id, customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ReportForm>>(initialState);
    const [drafts, setDrafts] = useState<ReportDraft[]>([]);
    const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [step, setStep] = useState<1 | 2>(1);
    const [dionicaError, setDionicaError] = useState<string>('');
    const [calculated, setCalculated] = useState<CalculatedResults>({
        waterLoss: 0,
        waterVolumeLoss: 0,
        wettedShaftSurface: 0,
        wettedPipeSurface: 0,
        totalWettedArea: 0,
        allowedLossL: 0,
        allowedLossMm: 0,
        hydrostaticHeight: 0,
        result: 0,
        satisfies: false
    });

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


    useEffect(() => {
        // Convert inputs from mm/cm to meters for calculations
        const formDataInMeters = {
            ...formData,
            pane_diameter: (formData.pane_diameter || 0) / 1000, // mm to m
            pane_width: (formData.pane_width || 0) / 100, // cm to m (for rectangular)
            pane_length: (formData.pane_length || 0) / 100, // cm to m (for rectangular)
            pane_height: (formData.pane_height || 0) / 100, // cm to m
            pipe_diameter: (formData.pipe_diameter || 0) / 1000, // mm to m
            water_height: (formData.water_height || 0) / 100, // cm to m
            depositional_height: (formData.depositional_height || 0) // already in m
        };

        const results = calc.calculateWaterReport(formDataInMeters as ReportForm);

        // Calculate wetted shaft surface separately for display
        const wettedShaftSurface = calc.calculateWettedShaftSurface(
            formData.draft_id || 1,
            formData.material_type_id || 1,
            (formData.water_height || 0) / 100, // cm to m
            (formData.pane_diameter || 0) / 1000, // mm to m
            (formData.pane_width || 0) / 100, // cm to m (for rectangular)
            (formData.pane_length || 0) / 100 // cm to m (for rectangular)
        );

        // Calculate wetted pipe surface separately for display
        let wettedPipeSurface = 0;

        // For Schema C (Pipe Only), calculate based on shaft type
        if (formData.draft_id === 2) {
            if (formData.material_type_id === 1) {
                // Round: Main pipe (covered by wettedShaftSurface) + secondary pipe
                const secondaryPipeDiameter = (formData.pipe_diameter || 0) / 1000; // mm to m
                const secondaryPipeSurface = calc.calculateWettedPipeSurface(
                    formData.draft_id,
                    secondaryPipeDiameter,
                    formData.pipe_length || 0
                );

                wettedPipeSurface = secondaryPipeSurface;
            } else if (formData.material_type_id === 2) {
                // Rectangular: Channel (covered by wettedShaftSurface) + small pipe
                const secondaryPipeDiameter = (formData.pipe_diameter || 0) / 1000; // mm to m
                const secondaryPipeSurface = calc.calculateWettedPipeSurface(
                    formData.draft_id,
                    secondaryPipeDiameter,
                    formData.pipe_length || 0
                );

                wettedPipeSurface = secondaryPipeSurface;
            }
        } else {
            // For other schemes, use single pipe calculation
            wettedPipeSurface = calc.calculateWettedPipeSurface(
                formData.draft_id || 1,
                (formData.pipe_diameter || 0) / 1000, // mm to m
                formData.pipe_length || 0 // already in m
            );
        }

        // Calculate hydrostatic height
        const hydrostaticHeight = calc.calculateHydrostaticHeight(
            formData.draft_id || 1,
            (formData.water_height || 0) / 100, // cm to m
            (formData.pipe_diameter || 0) / 1000, // mm to m
            formData.depositional_height || 0
        );

        setCalculated({ ...results, wettedShaftSurface, wettedPipeSurface, hydrostaticHeight });

        // Auto-fill deviation text for Schema C when hydrostatic height < 100cm
        if (formData.draft_id === 2 && hydrostaticHeight < 1.0) {
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
    }, [formData]);

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

            if (!id || id === 'new') {
                await reportService.create(dataToSave as ReportForm);
            } else {
                await reportService.update(id!, dataToSave as ReportForm);
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

    const isShaftRound = formData.material_type_id === 1;
    const isShaftRectangular = formData.material_type_id === 2;
    const showPipeFields = [2, 3, 5].includes(formData.draft_id || 0);
    const showGullyFields = [4, 5].includes(formData.draft_id || 0);

    if (loading && id && id !== 'new') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1800px] mx-auto px-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
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
                            <Button variant="outline" onClick={() => generatePDF(formData)}>
                                <FileDown className="h-4 w-4 mr-2" />
                                {t('reports.form.exportPdf')}
                            </Button>
                            <Button variant="outline" onClick={handleSaveAndNew}>
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
                                    <Input
                                        label={t('reports.form.dionicaLabel')}
                                        type="text"
                                        name="dionica"
                                        value={formData.dionica}
                                        onChange={handleChange}
                                        placeholder={t('reports.form.dionicaPlaceholder')}
                                    />
                                    {dionicaError && <p className="mt-1 text-sm text-destructive">{dionicaError}</p>}
                                    <Select
                                        label={t('reports.form.schemeLabel')}
                                        name="draft_id"
                                        value={formData.draft_id}
                                        onChange={handleChange}
                                    >
                                        {drafts.length === 0 && (
                                            <>
                                                <option value={1}>{t('reports.form.schemeA')}</option>
                                                <option value={3}>{t('reports.form.schemeB')}</option>
                                                <option value={2}>{t('reports.form.schemeC')}</option>
                                                <option value={4}>{t('reports.form.schemeD')}</option>
                                                <option value={5}>{t('reports.form.schemeE')}</option>
                                            </>
                                        )}
                                        {drafts.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </Select>
                                    <Select
                                        label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyType') : t('reports.form.shaftType')}
                                        name="material_type_id"
                                        value={formData.material_type_id}
                                        onChange={handleChange}
                                    >
                                        {materialTypes.length === 0 && (
                                            <>
                                                <option value={1}>{t('reports.form.round')}</option>
                                                <option value={2}>{t('reports.form.rectangular')}</option>
                                            </>
                                        )}
                                        {materialTypes.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </Select>
                                    <Select
                                        label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyMaterial') : t('reports.form.shaftMaterial')}
                                        name="pane_material_id"
                                        value={formData.pane_material_id || (isShaftRound ? 1 : 6)}
                                        onChange={handleChange}
                                    >
                                        {materials.length > 0 ? (
                                            materials.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))
                                        ) : (
                                            <option value={1}>{t('reports.form.standardMaterial')}</option>
                                        )}
                                    </Select>
                                </div>
                            </div>

                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.dimensions')}</h3>
                                <div className="space-y-4">
                                    {isShaftRound && (
                                        <Input
                                            label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyDiameter') : t('reports.form.paneDiameterMm')}
                                            type="number"
                                            step="1"
                                            name="pane_diameter"
                                            value={formData.pane_diameter}
                                            onChange={handleChange}
                                        />
                                    )}
                                    {isShaftRectangular && formData.draft_id !== 2 && (
                                        <>
                                            <Input
                                                label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyWidth') : t('reports.form.paneWidthCm')}
                                                type="number"
                                                step="0.01"
                                                name="pane_width"
                                                value={formData.pane_width}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyLength') : t('reports.form.paneLengthCm')}
                                                type="number"
                                                step="0.01"
                                                name="pane_length"
                                                value={formData.pane_length}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label={formData.draft_id === 4 || formData.draft_id === 5 ? t('reports.form.gullyHeight') : t('reports.form.shaftHeight')}
                                                type="number"
                                                step="0.01"
                                                name="pane_height"
                                                value={formData.pane_height}
                                                onChange={handleChange}
                                            />
                                        </>
                                    )}

                                    {formData.draft_id === 2 && isShaftRound && (
                                        <Input
                                            label={t('reports.form.mainPipeDiameter')}
                                            type="number"
                                            step="1"
                                            name="pane_diameter"
                                            value={formData.pane_diameter}
                                            onChange={handleChange}
                                        />
                                    )}

                                    {formData.draft_id === 2 && isShaftRectangular && (
                                        <>
                                            <Input
                                                label={t('reports.form.channelWidth')}
                                                type="number"
                                                step="0.01"
                                                name="pane_width"
                                                value={formData.pane_width}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label={t('reports.form.channelLength')}
                                                type="number"
                                                step="0.01"
                                                name="pane_length"
                                                value={formData.pane_length}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label={t('reports.form.channelHeight')}
                                                type="number"
                                                step="0.01"
                                                name="pane_height"
                                                value={formData.pane_height}
                                                onChange={handleChange}
                                            />
                                        </>
                                    )}

                                    {isShaftRound && (
                                        <Input
                                            label={t('reports.form.roHeight')}
                                            type="number"
                                            step="0.01"
                                            name="ro_height"
                                            value={formData.ro_height}
                                            onChange={handleChange}
                                        />
                                    )}

                                    <Input
                                        label={t('reports.form.waterHeight')}
                                        type="number"
                                        step="0.01"
                                        name="water_height"
                                        value={formData.water_height}
                                        onChange={handleChange}
                                    />
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">{t('reports.form.duration')}</label>
                                        <input
                                            type="text"
                                            name="examination_duration"
                                            value={formData.examination_duration || '00:30:00'}
                                            onChange={handleChange}
                                            placeholder="00:30:00"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">{t('reports.form.saturationTime')}</label>
                                        <input
                                            type="text"
                                            name="saturation_time"
                                            value={formData.saturation_time || '01:00:00'}
                                            onChange={handleChange}
                                            placeholder="01:00:00"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        />
                                    </div>
                                    {showPipeFields && (
                                        <>
                                            <Select
                                                label={t('reports.form.pipeMaterial')}
                                                name="pipe_material_id"
                                                value={formData.pipe_material_id || 1}
                                                onChange={handleChange}
                                            >
                                                {materials.length > 0 ? (
                                                    materials.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))
                                                ) : (
                                                    <option value={1}>{t('reports.form.standardPipe')}</option>
                                                )}
                                            </Select>
                                            <Input
                                                label={t('reports.form.pipeDiameterMm')}
                                                type="number"
                                                step="1"
                                                name="pipe_diameter"
                                                value={formData.pipe_diameter}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label={t('reports.form.pipeLengthMeters')}
                                                type="number"
                                                step="0.01"
                                                name="pipe_length"
                                                value={formData.pipe_length}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label={t('reports.form.slope')}
                                                type="number"
                                                step="0.01"
                                                name="pipeline_slope"
                                                value={formData.pipeline_slope}
                                                onChange={handleChange}
                                            />
                                        </>
                                    )}
                                    {showGullyFields && formData.draft_id !== 4 && (
                                        <Input
                                            label={t('reports.form.depositionalHeight')}
                                            type="number"
                                            step="0.01"
                                            name="depositional_height"
                                            value={formData.depositional_height}
                                            onChange={handleChange}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex justify-end">
                            <Button type="button" onClick={() => setStep(2)} size="lg">
                                {t('reports.form.nextStep')} <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.measurementsSection')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label={t('reports.form.startWaterLevel')}
                                        type="number"
                                        step="0.01"
                                        name="water_height_start"
                                        value={formData.water_height_start}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        label={t('reports.form.endWaterLevel')}
                                        type="number"
                                        step="0.01"
                                        name="water_height_end"
                                        value={formData.water_height_end}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">{t('reports.form.notesSection')}</h3>
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

                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} size="lg">
                                    <ChevronLeft className="mr-2 h-5 w-5" /> {t('reports.form.prevStep')}
                                </Button>
                                <div className="flex space-x-3">
                                    <Button type="submit" size="lg">
                                        <Save className="mr-2 h-4 w-4" />
                                        {t('reports.form.saveReport')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
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
                                        <ResultRow label={t('reports.form.wettedShaftSurface')} value={`${calculated.wettedShaftSurface.toFixed(2)} m²`} />
                                        {showPipeFields && (
                                            <ResultRow label={t('reports.form.wettedPipeSurface')} value={`${calculated.wettedPipeSurface.toFixed(2)} m²`} />
                                        )}
                                        <ResultRow label={t('reports.form.totalWettedArea')} value={`${calculated.totalWettedArea.toFixed(2)} m²`} />
                                        <ResultRow label={t('reports.form.allowedLossLiters')} value={`${calculated.allowedLossL.toFixed(2)} ${t('reports.form.volumeLossUnit')}`} />
                                        <ResultRow label={t('reports.form.allowedLossMm')} value={`${calculated.allowedLossMm.toFixed(2)} ${t('reports.form.waterLossUnitMm')}`} />
                                        {showPipeFields && formData.draft_id !== 5 && calculated.hydrostaticHeight > 0 && (
                                            <ResultRow label={t('reports.form.hydrostaticHeight')} value={`${(calculated.hydrostaticHeight * 100).toFixed(0)} cm`} />
                                        )}
                                        <ResultRow label={t('reports.form.waterLoss')} value={`${calculated.waterLoss.toFixed(2)} ${t('reports.form.waterLossUnitMm')}`} />
                                        <ResultRow label={t('reports.form.volumeLoss')} value={`${calculated.waterVolumeLoss.toFixed(4)} ${t('reports.form.volumeLossUnit')}`} />
                                        <div className="pt-4 border-t border-border">
                                            <ResultRow label={t('reports.form.result')} value={`${calculated.result.toFixed(2)} ${t('reports.form.resultUnit')}`} highlight />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

const ResultRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div className="flex justify-between items-center">
        <span className={cn("text-sm", highlight ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
        <span className={cn("font-medium", highlight ? "text-lg text-primary" : "text-foreground")}>{value}</span>
    </div>
);
