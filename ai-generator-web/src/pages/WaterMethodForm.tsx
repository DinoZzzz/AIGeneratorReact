import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Loader2, Save, ArrowLeft, FileDown, Calculator, Plus, ArrowRight, ChevronLeft } from 'lucide-react';
import * as calc from '../lib/calculations/report';
import { generatePDF } from '../lib/pdfGenerator';
import type { ReportForm } from '../types';
import { cn } from '../lib/utils';

// Initial empty state
const initialState: Partial<ReportForm> = {
    type_id: 1, // Water
    draft_id: 1,
    material_type_id: 1, // Shaft
    temperature: 0,
    pipe_length: 0,
    pipe_diameter: 0,
    pane_width: 0,
    pane_length: 0,
    water_height: 0,
    water_height_start: 0,
    water_height_end: 0,
    pressure_start: 0,
    pressure_end: 0,
    pane_diameter: 0,
    ro_height: 0,
    depositional_height: 0,
    pipeline_slope: 0,
};

interface CalculatedResults {
    waterLoss: number;
    waterVolumeLoss: number;
    totalWettedArea: number;
    allowedLossL: number;
    result: number;
    satisfies: boolean;
}

export const WaterMethodForm = () => {
    const { id, customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ReportForm>>(initialState);
    const [step, setStep] = useState<1 | 2>(1); // Step state
    const [calculated, setCalculated] = useState<CalculatedResults>({
        waterLoss: 0,
        waterVolumeLoss: 0,
        totalWettedArea: 0,
        allowedLossL: 0,
        result: 0,
        satisfies: false
    });

    useEffect(() => {
        if (id && id !== 'new') {
            loadReport(id);
        }
    }, [id]);

    useEffect(() => {
        // Recalculate whenever form data changes
        const results = calc.calculateWaterReport(formData as ReportForm);
        setCalculated(results);

        // Auto-generate deviation text
        const hydrostaticHeight = calc.calculateHydrostaticHeight(
            formData.draft_id || 1,
            formData.water_height || 0,
            formData.pipe_diameter || 0,
            formData.depositional_height || 0
        );

        if (formData.draft_id === 2 && hydrostaticHeight < 1.0) {
            const autoText = "Kod pojedinih dionica h2<100cm";
            if (formData.deviation !== autoText) {
                setFormData(prev => ({ ...prev, deviation: autoText }));
            }
        }
    }, [formData]);

    const loadReport = async (reportId: string) => {
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
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const saveReport = async (shouldRedirect: boolean) => {
        try {
            setLoading(true);
            const dataToSave = {
                ...formData,
                ...calculated,
                customer_id: customerId ? parseInt(customerId) : formData.customer_id,
                construction_id: constructionId ? parseInt(constructionId) : formData.construction_id,
                type_id: 1 // Ensure it's water type
            };

            if (id === 'new') {
                await reportService.create(dataToSave as ReportForm);
            } else {
                await reportService.update(id!, dataToSave as ReportForm);
            }

            if (shouldRedirect) {
                if (customerId && constructionId) {
                    navigate(`/customers/${customerId}/constructions/${constructionId}/reports`);
                } else {
                    navigate('/reports');
                }
            } else {
                // Reset form for new entry
                setFormData(prev => ({
                    ...prev,
                    stock: '',
                    water_height_start: 0,
                    water_height_end: 0,
                    satisfies: false,
                    // Keep dimensions and other context
                }));
                setStep(1); // Reset to step 1
                if (id !== 'new') {
                    navigate(`/customers/${customerId}/constructions/${constructionId}/reports/new/water`);
                }
                alert('Report saved. Ready for next entry.');
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

    // Visibility Logic
    const isShaftRound = formData.material_type_id === 1;
    const isShaftRectangular = formData.material_type_id === 2;
    const showPipeFields = formData.draft_id !== 1; // 1 = Shaft only
    const showGullyFields = formData.draft_id === 8; // 8 = Gully

    if (loading && id && id !== 'new') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                    >
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
                            <Button
                                variant="outline"
                                onClick={() => generatePDF(formData)}
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Export PDF
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleSaveAndNew}
                                disabled={loading}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Save & New
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Step 1: Parameters & Dimensions */}
                {step === 1 && (
                    <div className="lg:col-span-3 space-y-6">
                        {/* Basic Info Card */}
                        <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                <Calculator className="h-5 w-5 mr-2 text-primary" />
                                Test Parameters
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Select
                                    label="Draft"
                                    name="draft_id"
                                    value={formData.draft_id}
                                    onChange={handleChange}
                                    options={[
                                        { value: 1, label: 'Testing of Shaft' },
                                        { value: 2, label: 'Testing of Pipe' },
                                        { value: 3, label: 'Testing of Shaft and Pipe' },
                                        { value: 8, label: 'Testing of Gully' },
                                    ]}
                                />
                                <Select
                                    label="Material Type"
                                    name="material_type_id"
                                    value={formData.material_type_id}
                                    onChange={handleChange}
                                    options={[
                                        { value: 1, label: 'Shaft (Round)' },
                                        { value: 2, label: 'Shaft (Rectangular)' },
                                    ]}
                                />
                                <Input
                                    label="Examination Date"
                                    type="date"
                                    name="examination_date"
                                    value={formData.examination_date?.toString().split('T')[0]}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Temperature (°C)"
                                    type="number"
                                    name="temperature"
                                    value={formData.temperature}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Stock / Section"
                                    name="stock"
                                    value={formData.stock || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Dimensions Card */}
                        <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Dimensions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {isShaftRound && (
                                    <>
                                        <Input
                                            label="Pane Diameter (m)"
                                            type="number"
                                            step="0.01"
                                            name="pane_diameter"
                                            value={formData.pane_diameter}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            label="Ro Height (m)"
                                            type="number"
                                            step="0.01"
                                            name="ro_height"
                                            value={formData.ro_height}
                                            onChange={handleChange}
                                        />
                                    </>
                                )}
                                {isShaftRectangular && (
                                    <>
                                        <Input
                                            label="Pane Width (m)"
                                            type="number"
                                            step="0.01"
                                            name="pane_width"
                                            value={formData.pane_width}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            label="Pane Length (m)"
                                            type="number"
                                            step="0.01"
                                            name="pane_length"
                                            value={formData.pane_length}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            label="Pane Height (m)"
                                            type="number"
                                            step="0.01"
                                            name="pane_height"
                                            value={formData.pane_height}
                                            onChange={handleChange}
                                        />
                                    </>
                                )}

                                <Input
                                    label="Water Height (m)"
                                    type="number"
                                    step="0.01"
                                    name="water_height"
                                    value={formData.water_height}
                                    onChange={handleChange}
                                />

                                {showPipeFields && (
                                    <>
                                        <Input
                                            label="Pipe Diameter (m)"
                                            type="number"
                                            step="0.01"
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
                                    </>
                                )}

                                {showGullyFields && (
                                    <>
                                        <Input
                                            label="Depositional Height (m)"
                                            type="number"
                                            step="0.01"
                                            name="depositional_height"
                                            value={formData.depositional_height}
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
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="button" onClick={() => setStep(2)} size="lg">
                                Next Step <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Measurements & Results */}
                {step === 2 && (
                    <>
                        <div className="lg:col-span-2 space-y-6">
                            {/* Measurements Card */}
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

                            {/* Notes Card */}
                            <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
                                <div className="space-y-4">
                                    <Input
                                        label="Remark"
                                        name="remark"
                                        value={formData.remark || ''}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        label="Deviation"
                                        name="deviation"
                                        value={formData.deviation || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                             <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} size="lg">
                                    <ChevronLeft className="mr-2 h-5 w-5" /> Previous Step
                                </Button>
                             </div>
                        </div>

                        {/* Right Column: Results */}
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
                                        <ResultRow label="Water Loss" value={`${calculated.waterLoss.toFixed(2)} mm`} />
                                        <ResultRow label="Volume Loss" value={`${calculated.waterVolumeLoss.toFixed(4)} l`} />
                                        <ResultRow label="Total Wetted Area" value={`${calculated.totalWettedArea.toFixed(2)} m²`} />
                                        <ResultRow label="Allowed Loss" value={`${calculated.allowedLossL.toFixed(2)} l`} />
                                        <div className="pt-4 border-t border-border">
                                            <ResultRow label="Result" value={`${calculated.result.toFixed(2)} l/m²`} highlight />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
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
