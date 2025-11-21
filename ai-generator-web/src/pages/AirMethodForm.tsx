import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Loader2, Save, ArrowLeft, FileDown, Calculator, Plus, ArrowRight, ChevronLeft } from 'lucide-react';
import { Stepper } from '../components/ui/Stepper';
import { Loader2, Save, ArrowLeft, FileDown, ArrowRight, Calculator } from 'lucide-react';
import * as calc from '../lib/calculations/report';
import { calculateTestTime } from '../lib/calculations/testTime';
import { generatePDF } from '../lib/pdfGenerator';
import type { ReportForm } from '../types';
import { cn } from '../lib/utils';

// Initial empty state
const initialState: Partial<ReportForm> = {
    type_id: 2, // Air
    draft_id: 1, // Kvadratni / Okrugli (matches C# combos)
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
    examination_duration: '05:00', // Default
    stock: '',
    remark: '',
    deviation: ''
};

interface ExaminationProcedure {
    id: number;
    name: string;
    pressure: number;
    allowed_loss: number;
}

interface CalculatedResults {
    pressureLoss: number;
    allowedLoss: number;
    satisfies: boolean;
    testTime: string;
}

const NUMERIC_FIELDS = [
    'type_id', 'draft_id', 'material_type_id', 'pane_material_id', 'examination_procedure_id',
    'temperature', 'pipe_length', 'pipe_diameter', 'pane_width', 'pane_length',
    'pressure_start', 'pressure_end', 'pane_diameter',
    'customer_id', 'construction_id', 'ordinal'
];

export const AirMethodForm = () => {
    const { id, customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ReportForm>>(initialState);
    const [procedures, setProcedures] = useState<ExaminationProcedure[]>([]);
    const [step, setStep] = useState<1 | 2>(1); // Step state
    const [calculated, setCalculated] = useState<CalculatedResults>({
        pressureLoss: 0,
        allowedLoss: 0,
        satisfies: false,
        testTime: '00:00'
    });

    useEffect(() => {
        loadProcedures();
        if (id && id !== 'new') {
            loadReport(id);
        }
    }, [id]);

    useEffect(() => {
        // Find selected procedure
        const procedure = procedures.find(p => p.id === formData.examination_procedure_id);
        const allowedLoss = procedure?.allowed_loss || 0.10; // Fallback

        // Calculate Pressure Loss
        const pressureLoss = calc.calculatePressureLoss(formData.pressure_start || 0, formData.pressure_end || 0);

        // Calculate Satisfies
        const satisfies = calc.isSatisfying(0, 0, 2, pressureLoss, allowedLoss);

        // Calculate Test Time (using ported logic)
        // Note: C# passes diameter as integer. For pipe or pane depending on draft.
        // Logic inferred from AirMethodForm.cs UpdateTestTime()
        // draft.Id != 6 ? numPaneDiameter : numPipeDiameter
        // Assuming Draft 6 is special, but generally checking draft ID.
        // Let's use pipe diameter if draft relates to pipe, else pane.
        let diameter = 0;
        // Draft 1 = Shaft, Draft 2 = Pipe ... roughly.
        if (formData.draft_id === 2 || formData.draft_id === 3) {
            diameter = (formData.pipe_diameter || 0) * 1000;
        } else {
            diameter = (formData.pane_diameter || 0) * 1000;
        }

        const timeMinutes = calculateTestTime(
            formData.examination_procedure_id || 1,
            formData.draft_id || 1,
            Math.round(diameter)
        );

        // Convert decimal minutes to mm:ss
        const mins = Math.floor(timeMinutes);
        const secs = Math.round((timeMinutes - mins) * 60);
        const testTimeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        setCalculated({
            pressureLoss,
            allowedLoss,
            satisfies,
            testTime: testTimeString
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number = value;

        if (type === 'number' || NUMERIC_FIELDS.includes(name)) {
            finalValue = parseFloat(value) || 0;
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleSave = async (createNext: boolean = false) => {
        try {
            setLoading(true);
            const dataToSave = {
                ...formData,
                satisfies: calculated.satisfies,
                customer_id: customerId ? customerId : formData.customer_id,
                construction_id: constructionId ? constructionId : formData.construction_id,
                type_id: 2
            };

            // let savedId = id;
            if (id === 'new') {
                await reportService.create(dataToSave as ReportForm);
                // Assuming create returns the object, or we just proceed
                // savedId = 'created';
            } else {
                await reportService.update(id!, dataToSave as ReportForm);
            }

            if (createNext) {
                // Reset form for new entry but keep some fields like construction/date if needed
                // C# logic: Copies relevant fields, increments Ordinal.
                // For now, we reload page as 'new' or reset state.
                setFormData({
                    ...initialState,
                    customer_id: dataToSave.customer_id,
                    construction_id: dataToSave.construction_id,
                    examination_date: dataToSave.examination_date,
                    // Increment ordinal logic would go here if backend doesn't handle it
                });
                setActiveTab('page1'); // Go back to start
                navigate(`/customers/${customerId}/constructions/${constructionId}/reports/new/air`);
            } else {
                if (customerId && constructionId) {
                    navigate(`/customers/${customerId}/constructions/${constructionId}/reports`);
                } else {
                    navigate('/reports');
                }
            } else {
                // Reset form for new entry, keeping some context
                // We keep: procedure, draft, material, date
                // We reset: stock, measurements
                setFormData(prev => ({
                    ...prev,
                    stock: '',
                    pipe_length: 0,
                    pressure_start: 0,
                    pressure_end: 0,
                    examination_start_time: '',
                    examination_end_time: '',
                    satisfies: false,
                    // Keep dimensions? Usually dimensions change per section, but maybe not pipe diameter.
                    // Let's keep diameter/width/height as they might be same for a run.
                    // Let's reset pressure.
                }));
                setStep(1);
                if (id !== 'new') {
                    navigate(`/customers/${customerId}/constructions/${constructionId}/reports/new/air`);
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
        handleSave(true);
    };

    // const handleSaveAndNew = (e: React.MouseEvent) => {
    //     e.preventDefault();
    //     handleSave(false);
    // };

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
    // Visibility Logic
    // const isShaftRound = formData.material_type_id === 1;
    // const isShaftRectangular = formData.material_type_id === 2;
    // const showPipeFields = formData.draft_id !== 1; // 1 = Shaft only

    if (loading && id && id !== 'new') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1800px] mx-auto space-y-6 px-6">
            {/* Header / Navigation */}
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
                            AI Generator
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
                    <Button
                        variant="outline"
                        onClick={() => generatePDF(formData)}
                    >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                    {activeTab === 'page2' && (
                        <div className="text-sm text-muted-foreground italic">
                            Popunite rezultate mjerenja
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-8">
                <Stepper
                    steps={['Osnovni Podaci', 'Mjerenja i Rezultati']}
                    currentStep={activeTab === 'page1' ? 0 : 1}
                    onStepClick={(step) => setActiveTab(step === 0 ? 'page1' : 'page2')}
                />
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Step 1: Parameters & Dimensions */}
                {step === 1 && (
                    <div className="lg:col-span-3 space-y-6">
                {activeTab === 'page1' && (
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
                                        label="Temperatura (°C)"
                                        type="number"
                                        name="temperature"
                                        value={formData.temperature}
                                        onChange={handleChange}
                                    />

                                    <Input
                                        label="Datum ispitivanja"
                                        type="date"
                                        name="examination_date"
                                        value={formData.examination_date?.toString().split('T')[0]}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted p-8">
                                    {/* Placeholder for Image/Scheme */}
                                    <div className="text-center text-muted-foreground">
                                        <p>Skica: {formData.draft_id}</p>
                                        <span className="text-xs">(Prikaz skice nije implementiran)</span>
                                    </div>
                                </div>
                                <Input
                                    label="Stock / Section"
                                    name="stock"
                                    value={formData.stock || ''}
                                    onChange={handleChange}
                                />
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
                            <div className="absolute bottom-6 right-6">
                                <Button onClick={() => setActiveTab('page2')} className="w-32">
                                    Sljedeće <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'page2' && (
                    <div className="lg:col-span-3 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h2 className="text-xl font-semibold">Mjerenja i Rezultati</h2>
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('page1')}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Povratak
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Column 1: Materials & Dimensions */}
                            <div className="space-y-6">
                                <div className="p-4 border rounded-lg bg-muted/10 space-y-4 h-full">
                                    <h3 className="font-medium text-primary">Materijali i Dimenzije</h3>

                                    <Input
                                        label="Dionica"
                                        name="stock"
                                        value={formData.stock || ''}
                                        onChange={handleChange}
                                    />

                                    <Select
                                        label="Tip okna"
                                        name="material_type_id"
                                        value={formData.material_type_id}
                                        onChange={handleChange}
                                        options={[
                                            { value: 1, label: 'Okrugli' },
                                            { value: 2, label: 'Kvadratni' },
                                        ]}
                                    />

                                    <Select
                                        label="Metoda ispitivanja"
                                        name="examination_procedure_id"
                                        value={formData.examination_procedure_id || ''}
                                        onChange={handleChange}
                                        options={procedures.map(p => ({ value: p.id, label: p.name }))}
                                    />

                                    {/* Conditional fields based on Draft */}
                                    {formData.draft_id !== 2 && (
                                        <>
                                            <Select
                                                label="Materijal okna"
                                                name="pane_material_id"
                                                value={formData.pane_material_id || 1}
                                                onChange={handleChange}
                                                options={[
                                                    { value: 1, label: 'Beton' },
                                                    { value: 2, label: 'Polimer' }
                                                ]}
                                            />
                                            <Input
                                                label="Promjer okna (m)"
                                                type="number"
                                                step="0.01"
                                                name="pane_diameter"
                                                value={formData.pane_diameter}
                                                onChange={handleChange}
                                            />
                                        </>
                                    )}

                                    {formData.draft_id !== 1 && (
                                        <>
                                            <Input
                                                label="Dužina cijevi (m)"
                                                type="number"
                                                step="0.01"
                                                name="pipe_length"
                                                value={formData.pipe_length}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="Promjer cijevi (m)"
                                                type="number"
                                                step="0.01"
                                                name="pipe_diameter"
                                                value={formData.pipe_diameter}
                                                onChange={handleChange}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Pressure & Time */}
                            <div className="space-y-6">
                                <div className="p-4 border rounded-lg bg-muted/10 space-y-4 h-full">
                                    <h3 className="font-medium text-primary">Tlak i Vrijeme</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground">V. stabilizacije</label>
                                            <div className="font-mono text-lg bg-background border px-3 py-1 rounded">05:00</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground">V. ispitivanja (izračunato)</label>
                                            <div className="font-mono text-lg bg-background border px-3 py-1 rounded text-blue-600">
                                                {calculated.testTime}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Tlak na početku (mbar)"
                                            type="number"
                                            step="0.1"
                                            name="pressure_start"
                                            value={formData.pressure_start}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            label="Tlak na kraju (mbar)"
                                            type="number"
                                            step="0.1"
                                            name="pressure_end"
                                            value={formData.pressure_end}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="pt-2 border-t mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-muted-foreground">Pad tlaka:</span>
                                            <span className="font-bold text-lg">{calculated.pressureLoss.toFixed(2)} mbar</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Dozvoljeni pad:</span>
                                            <span className="font-bold text-lg">{calculated.allowedLoss.toFixed(2)} mbar</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Results & Remarks */}
                            <div className="space-y-6">
                                {/* Result Box */}
                                <div className={cn(
                                    "p-6 rounded-xl border-2 flex flex-col items-center justify-center text-center shadow-sm transition-colors duration-300",
                                    calculated.satisfies
                                        ? "bg-green-50 border-green-500/50 text-green-900"
                                        : "bg-red-50 border-red-500/50 text-red-900"
                                )}>
                                    <span className="text-sm uppercase tracking-widest font-semibold mb-1 opacity-70">
                                        Rezultat Ispitivanja
                                    </span>
                                    <span className="text-3xl font-black tracking-tight my-2">
                                        {calculated.satisfies ? 'ZADOVOLJAVA' : 'NE ZADOVOLJAVA'}
                                    </span>
                                    <div className="flex items-center space-x-2 mt-2 bg-white/50 px-3 py-1 rounded-full">
                                        <span className="text-sm font-medium">Pad tlaka:</span>
                                        <span className="text-lg font-mono font-bold">
                                            {calculated.pressureLoss.toFixed(2)} mbar
                                        </span>
                                    </div>
                                </div>

                                {/* Remarks */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Napomena</label>
                                        <textarea
                                            name="remark"
                                            value={formData.remark || ''}
                                            onChange={handleChange}
                                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Odstupanje od norme</label>
                                        <textarea
                                            name="deviation"
                                            value={formData.deviation || ''}
                                            onChange={handleChange}
                                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </form>
        </div>

                        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                            <Button
                                variant="outline"
                                onClick={() => handleSave(true)}
                                disabled={loading}
                                type="button"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Spremi i dodaj novi
                            </Button>
                            <Button
                                onClick={() => handleSave(false)}
                                disabled={loading}
                                type="button"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Spremi i završi
                            </Button>
                        </div>
                    </div>
                )}
            </form >
        </div >
    );
};
