import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Loader2, Save, ArrowLeft, FileDown, Calculator } from 'lucide-react';
import * as calc from '../lib/calculations/report';
import { generatePDF } from '../lib/pdfGenerator';
import type { ReportForm, ExaminationProcedure } from '../types';
import { cn } from '../lib/utils';
import { calculateRequiredTestTime, formatTime } from '../lib/calculations/testTime';

// Initial empty state
const initialState: Partial<ReportForm> = {
    type_id: 2, // Air
    draft_id: 1,
    material_type_id: 1, // Shaft
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
};

interface CalculatedResults {
    pressureLoss: number;
    allowedLoss: number;
    satisfies: boolean;
    requiredTestTime: number; // in minutes
}

export const AirMethodForm = () => {
    const { id, customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ReportForm>>(initialState);
    const [procedures, setProcedures] = useState<ExaminationProcedure[]>([]);
    const [calculated, setCalculated] = useState<CalculatedResults>({
        pressureLoss: 0,
        allowedLoss: 0,
        satisfies: false,
        requiredTestTime: 0
    });

    useEffect(() => {
        loadProcedures();
        if (id && id !== 'new') {
            loadReport(id);
        }
    }, [id]);

    useEffect(() => {
        // Recalculate whenever form data changes
        const selectedProcedure = procedures.find(p => p.id === formData.examination_procedure_id);
        const allowedLoss = selectedProcedure?.allowed_loss || 0.10; // Default to 0.10 if not found

        const results = calc.calculateAirReport(formData as ReportForm, allowedLoss);

        // Calculate Test Time
        // Clause 13.2 says "Testing of individual pipes...". 
        // Let's use the pipe diameter if it exists, otherwise pane diameter.

        let diameter = 0;
        if (formData.draft_id === 1) {
            diameter = formData.pane_diameter || 0;
        } else {
            diameter = formData.pipe_diameter || 0;
        }

        // Method is usually derived from pressure. 
        // 10mbar = LA, 50mbar = LB, 100mbar = LC, 200mbar = LD.
        // Let's guess method based on start pressure.
        let method: 'LA' | 'LB' | 'LC' | 'LD' = 'LA';
        const p = formData.pressure_start || 0;
        if (p >= 200) method = 'LD';
        else if (p >= 100) method = 'LC';
        else if (p >= 50) method = 'LB';

        const requiredTestTime = calculateRequiredTestTime(method, diameter, formData.draft_id === 1);

        setCalculated({
            ...results,
            requiredTestTime
        });
    }, [formData, procedures]);

    const loadProcedures = async () => {
        const { data } = await supabase.from('examination_procedures').select('*');
        if (data) setProcedures(data);
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const dataToSave = {
                ...formData,
                ...calculated,
                customer_id: customerId ? parseInt(customerId) : formData.customer_id,
                construction_id: constructionId ? parseInt(constructionId) : formData.construction_id,
                type_id: 2 // Ensure it's air type
            };

            if (id === 'new') {
                await reportService.create(dataToSave as ReportForm);
            } else {
                await reportService.update(id!, dataToSave as ReportForm);
            }

            if (customerId && constructionId) {
                navigate(`/customers/${customerId}/constructions/${constructionId}/reports`);
            } else {
                navigate('/reports');
            }
        } catch (error) {
            console.error('Error saving report:', error);
            alert('Failed to save report');
        } finally {
            setLoading(false);
        }
    };

    // Visibility Logic
    const isShaftRound = formData.material_type_id === 1;
    const isShaftRectangular = formData.material_type_id === 2;
    const showPipeFields = formData.draft_id !== 1; // 1 = Shaft only

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
                        onClick={() => {
                            if (customerId && constructionId) {
                                navigate(`/customers/${customerId}/constructions/${constructionId}/reports`);
                            } else {
                                navigate('/reports');
                            }
                        }}
                    >
                        <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {id === 'new' ? 'New Air Test Report' : 'Edit Report'}
                        </h1>
                        <p className="text-sm text-muted-foreground">Enter test data and measurements</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => generatePDF(formData)}
                    >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Report
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input Forms */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                            <Calculator className="h-5 w-5 mr-2 text-primary" />
                            Test Parameters
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Examination Procedure"
                                name="examination_procedure_id"
                                value={formData.examination_procedure_id || ''}
                                onChange={handleChange}
                                options={procedures.map(p => ({ value: p.id, label: p.name }))}
                            />
                            <Select
                                label="Draft"
                                name="draft_id"
                                value={formData.draft_id}
                                onChange={handleChange}
                                options={[
                                    { value: 1, label: 'Testing of Shaft' },
                                    { value: 2, label: 'Testing of Pipe' },
                                    { value: 3, label: 'Testing of Shaft and Pipe' },
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
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    label="Start Time"
                                    type="time"
                                    name="examination_start_time"
                                    value={formData.examination_start_time || ''}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="End Time"
                                    type="time"
                                    name="examination_end_time"
                                    value={formData.examination_end_time || ''}
                                    onChange={handleChange}
                                />
                            </div>
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
                                <Input
                                    label="Pane Diameter (m)"
                                    type="number"
                                    step="0.01"
                                    name="pane_diameter"
                                    value={formData.pane_diameter}
                                    onChange={handleChange}
                                />
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
                        </div>
                    </div>

                    {/* Measurements Card */}
                    <div className="bg-card shadow-sm rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Pressure Measurements</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Start Pressure (mbar)"
                                type="number"
                                step="0.01"
                                name="pressure_start"
                                value={formData.pressure_start}
                                onChange={handleChange}
                            />
                            <Input
                                label="End Pressure (mbar)"
                                type="number"
                                step="0.01"
                                name="pressure_end"
                                value={formData.pressure_end}
                                onChange={handleChange}
                            />
                        </div>
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
                                <ResultRow label="Pressure Loss" value={`${calculated.pressureLoss.toFixed(2)} mbar`} />
                                <div className="pt-4 border-t border-border">
                                    <ResultRow label="Allowed Loss" value={`${calculated.allowedLoss.toFixed(2)} mbar`} highlight />
                                </div>
                                <div className="pt-4 border-t border-border">
                                    <ResultRow label="Required Time" value={`${formatTime(calculated.requiredTestTime)} min`} />
                                    <ResultRow
                                        label="Actual Time"
                                        value={
                                            formData.examination_start_time && formData.examination_end_time
                                                ? (() => {
                                                    const start = new Date(`1970-01-01T${formData.examination_start_time}`);
                                                    const end = new Date(`1970-01-01T${formData.examination_end_time}`);
                                                    const diff = (end.getTime() - start.getTime()) / 60000;
                                                    return diff > 0 ? `${formatTime(diff)} min` : '-';
                                                })()
                                                : '-'
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
