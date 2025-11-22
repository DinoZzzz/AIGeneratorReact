import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Loader2, Save, ArrowLeft, FileDown, Plus, ArrowRight, ChevronLeft } from 'lucide-react';
import { Stepper } from '../components/ui/Stepper';
import * as calc from '../lib/calculations/report';
import { generatePDF } from '../lib/pdfGenerator';
import type { ReportForm } from '../types';
import { cn } from '../lib/utils';

// Initial empty state
const initialState: Partial<ReportForm> = {
    type_id: 1, // Water
    draft_id: 1,
    material_type_id: 1, // Shaft
    pane_material_id: 1, // Default to PVC for round shaft
    pipe_material_id: 1, // Default to PVC for pipe
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
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ReportForm>>(initialState);
    const [step, setStep] = useState<1 | 2>(1);
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

    const loadReport = useCallback(async (reportId: string) => {
        try {
            setLoading(true);
            const data = await reportService.getById(reportId);
            setFormData(data);
        } catch (error) {
            console.error('Error loading report:', error);
            alert('Failed to load report');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id && id !== 'new') {
            loadReport(id);
        }
    }, [id, loadReport]);


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
        } else if (['draft_id', 'material_type_id'].includes(name)) {
            finalValue = parseInt(value, 10) || 0;
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const saveReport = async (shouldRedirect: boolean) => {
        try {
            setLoading(true);
            const dataToSave = {
                ...formData,
                ...calculated,
                customer_id: customerId || formData.customer_id,
                construction_id: constructionId || formData.construction_id,
                type_id: 1
            };

            if (id === 'new') {
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
                alert('Report saved. Ready for next entry.');
            } else {
                if (customerId && constructionId) {
                    navigate(`/customers/${customerId}/constructions/${constructionId}/reports`);
                } else {
                    navigate('/reports');
                }
            }
        } catch (error) {
            console.error('Error saving report:', error);
            alert('Failed to save report');
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
    // Schemes B (3), C (2), E (5) have pipes. Scheme A (1) and D (4) do not.
    const showPipeFields = [2, 3, 5].includes(formData.draft_id || 0);
    // Scheme E (5) is Gully + Pipe, Scheme D (4) is Gully.
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
                            {id === 'new' ? 'New Water Test Report' : 'Edit Report'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {step === 1 ? 'Step 1: Parameters & Dimensions' : 'Step 2: Measurements & Results'}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    {step === 2 && (
                        <>
                            <Button variant="outline" onClick={() => generatePDF(formData)}>
                                <FileDown className="h-4 w-4 mr-2" />
                                Export PDF
                            </Button>
                            <Button variant="outline" onClick={handleSaveAndNew}>
                                <Plus className="h-4 w-4 mr-2" />
                                Save & New
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Stepper
                steps={['Parameters', 'Measurements']}
                currentStep={step - 1}
                onStepClick={(s) => setStep((s + 1) as 1 | 2)}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">General Info</h3>
                                <div className="space-y-4">
                                    <Input
                                        label="Examination Date"
                                        type="date"
                                        name="examination_date"
                                        value={formData.examination_date}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        label="Temperature (°C)"
                                        type="number"
                                        step="0.1"
                                        name="temperature"
                                        value={formData.temperature}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Structure Type</h3>
                                <div className="space-y-4">
                                    <Select
                                        label="Scheme"
                                        name="draft_id"
                                        value={formData.draft_id}
                                        onChange={handleChange}
                                    >
                                        <option value={1}>Shema A – Ispitivanje okna</option>
                                        <option value={3}>Shema B – Ispitivanje okna i cijelovoda</option>
                                        <option value={2}>Shema C – Ispitivanje cijelovoda</option>
                                        <option value={4}>Shema D – Ispitivanje slivnika</option>
                                        <option value={5}>Shema E – Ispitivanje slivnika i cijelovoda</option>
                                    </Select>
                                    <Select
                                        label={formData.draft_id === 4 || formData.draft_id === 5 ? "Gully Type" : "Shaft Type"}
                                        name="material_type_id"
                                        value={formData.material_type_id}
                                        onChange={handleChange}
                                    >
                                        <option value={1}>Round {formData.draft_id === 4 || formData.draft_id === 5 ? 'Gully' : 'Shaft'}</option>
                                        <option value={2}>Rectangular {formData.draft_id === 4 || formData.draft_id === 5 ? 'Gully' : 'Shaft'}</option>
                                    </Select>
                                    <Select
                                        label={formData.draft_id === 4 || formData.draft_id === 5 ? "Gully Material" : "Shaft Material"}
                                        name="pane_material_id"
                                        value={formData.pane_material_id || (isShaftRound ? 1 : 6)}
                                        onChange={handleChange}
                                    >
                                        {isShaftRound ? (
                                            <>
                                                <option value={1}>PVC</option>
                                                <option value={2}>PE</option>
                                                <option value={3}>PEHD</option>
                                                <option value={4}>GRP</option>
                                            </>
                                        ) : (
                                            <option value={6}>Armirano betonska</option>
                                        )}
                                    </Select>
                                </div>
                            </div>

                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Dimensions</h3>
                                <div className="space-y-4">
                                    {isShaftRound && (
                                        <Input
                                            label={formData.draft_id === 4 || formData.draft_id === 5 ? "Gully Diameter (mm)" : "Pane Diameter (mm)"}
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
                                                label={formData.draft_id === 4 || formData.draft_id === 5 ? "Gully Width (cm)" : "Pane Width (cm)"}
                                                type="number"
                                                step="0.01"
                                                name="pane_width"
                                                value={formData.pane_width}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label={formData.draft_id === 4 || formData.draft_id === 5 ? "Gully Length (cm)" : "Pane Length (cm)"}
                                                type="number"
                                                step="0.01"
                                                name="pane_length"
                                                value={formData.pane_length}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label={formData.draft_id === 4 || formData.draft_id === 5 ? "Gully Height (cm)" : "Shaft Height (cm)"}
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
                                            label="Main Pipe Diameter (mm)"
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
                                                label="Channel Width (cm)"
                                                type="number"
                                                step="0.01"
                                                name="pane_width"
                                                value={formData.pane_width}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="Channel Length (cm)"
                                                type="number"
                                                step="0.01"
                                                name="pane_length"
                                                value={formData.pane_length}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="Channel Height (cm)"
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
                                            label="Ro Height (cm)"
                                            type="number"
                                            step="0.01"
                                            name="ro_height"
                                            value={formData.ro_height}
                                            onChange={handleChange}
                                        />
                                    )}

                                    <Input
                                        label="Water Height (cm)"
                                        type="number"
                                        step="0.01"
                                        name="water_height"
                                        value={formData.water_height}
                                        onChange={handleChange}
                                    />
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Duration (mm:ss)</label>
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
                                        <label className="text-sm font-medium mb-1 block">Saturation Time (hh:mm)</label>
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
                                                label="Pipe Material"
                                                name="pipe_material_id"
                                                value={formData.pipe_material_id || 1}
                                                onChange={handleChange}
                                            >
                                                <option value={1}>PVC</option>
                                                <option value={2}>PE</option>
                                                <option value={3}>PEHD</option>
                                                <option value={4}>GRP</option>
                                            </Select>
                                            <Input
                                                label="Pipe Diameter (mm)"
                                                type="number"
                                                step="1"
                                                name="pipe_diameter"
                                                value={formData.pipe_diameter}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="Pipe Length (m)"
                                                type="number"
                                                step="0.01"
                                                name="pipe_length"
                                                value={formData.pipe_length}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="Slope (%)"
                                                type="number"
                                                step="0.01"
                                                name="pipeline_slope"
                                                value={formData.pipeline_slope}
                                                onChange={handleChange}
                                            />
                                        </>
                                    )}
                                    {showGullyFields && (
                                        <Input
                                            label="Depositional Height (m)"
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
                                Next Step <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Measurements</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Start Water Level (mm)"
                                        type="number"
                                        step="0.01"
                                        name="water_height_start"
                                        value={formData.water_height_start}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        label="End Water Level (mm)"
                                        type="number"
                                        step="0.01"
                                        name="water_height_end"
                                        value={formData.water_height_end}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Remark</label>
                                        <textarea
                                            name="remark"
                                            value={formData.remark || ''}
                                            onChange={handleChange}
                                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            placeholder="Enter any remarks..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Deviation</label>
                                        <textarea
                                            name="deviation"
                                            value={formData.deviation || ''}
                                            onChange={handleChange}
                                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            placeholder="Enter any deviations from standard..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} size="lg">
                                    <ChevronLeft className="mr-2 h-5 w-5" /> Previous Step
                                </Button>
                                <div className="flex space-x-3">
                                    <Button type="submit" size="lg">
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Report
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-card shadow-sm rounded-xl border border-border p-6 sticky top-6">
                                <h3 className="text-lg font-semibold text-foreground mb-6">Calculated Results</h3>

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
                                        )}>Status</span>
                                        <span className={cn(
                                            "text-2xl font-bold",
                                            calculated.satisfies ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                                        )}>
                                            {calculated.satisfies ? 'SATISFIES' : 'FAILED'}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <ResultRow label="Wetted Shaft Surface" value={`${calculated.wettedShaftSurface.toFixed(2)} m²`} />
                                        {showPipeFields && (
                                            <ResultRow label="Wetted Pipe Surface" value={`${calculated.wettedPipeSurface.toFixed(2)} m²`} />
                                        )}
                                        <ResultRow label="Total Wetted Area" value={`${calculated.totalWettedArea.toFixed(2)} m²`} />
                                        <ResultRow label="Allowed Loss" value={`${calculated.allowedLossL.toFixed(2)} l`} />
                                        <ResultRow label="Allowed Loss" value={`${calculated.allowedLossMm.toFixed(2)} mm`} />
                                        {showPipeFields && calculated.hydrostaticHeight > 0 && (
                                            <ResultRow label="Hydrostatic Height" value={`${(calculated.hydrostaticHeight * 100).toFixed(0)} cm`} />
                                        )}
                                        <ResultRow label="Water Loss" value={`${calculated.waterLoss.toFixed(2)} mm`} />
                                        <ResultRow label="Volume Loss" value={`${calculated.waterVolumeLoss.toFixed(4)} l`} />
                                        <div className="pt-4 border-t border-border">
                                            <ResultRow label="Result" value={`${calculated.result.toFixed(2)} l/m²`} highlight />
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
