import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Loader2, Save, ArrowLeft, FileDown, ArrowRight } from 'lucide-react';
import * as calc from '../lib/calculations/report';
import { calculateTestTime } from '../lib/calculations/testTime';
import { generatePDF } from '../lib/pdfGenerator';
import type { ReportForm, ExaminationProcedure } from '../types';
import { cn } from '../lib/utils';
import { calculateRequiredTestTime, formatTime } from '../lib/calculations/testTime';

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
    const [activeTab, setActiveTab] = useState<'page1' | 'page2'>('page1');

    // Derived state for calculations
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
                customer_id: customerId ? parseInt(customerId) : formData.customer_id,
                construction_id: constructionId ? parseInt(constructionId) : formData.construction_id,
                type_id: 2
            };

            let savedId = id;
            if (id === 'new') {
                const res = await reportService.create(dataToSave as ReportForm);
                // Assuming create returns the object, or we just proceed
                savedId = 'created';
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
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header / Navigation */}
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
                            AI Generator
                        </h1>
                        <p className="text-sm text-muted-foreground">Metoda 1610 - Zrak</p>
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
                     {activeTab === 'page2' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => handleSave(true)}
                                disabled={loading}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Spremi i dodaj novi
                            </Button>
                            <Button
                                onClick={() => handleSave(false)}
                                disabled={loading}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Spremi i završi
                            </Button>
                        </>
                     )}
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-card shadow-sm rounded-xl border border-border p-6 min-h-[600px] relative">

                {activeTab === 'page1' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Osnovni podaci</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Select
                                    label="Skica (Draft)"
                                    name="draft_id"
                                    value={formData.draft_id}
                                    onChange={handleChange}
                                    options={[
                                        { value: 1, label: 'Ispitivanje okna' },
                                        { value: 2, label: 'Ispitivanje cjevovoda' },
                                        { value: 3, label: 'Ispitivanje okna i cjevovoda' },
                                    ]}
                                />

                                <Input
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
                        </div>

                        <div className="absolute bottom-6 right-6">
                            <Button onClick={() => setActiveTab('page2')} className="w-32">
                                Sljedeće <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'page2' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h2 className="text-xl font-semibold">Mjerenja i Rezultati</h2>
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('page1')}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Povratak
                            </Button>
                         </div>

                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             {/* Left Side: Inputs */}
                             <div className="space-y-6">
                                {/* Section 1: Materials & Dimensions */}
                                <div className="p-4 border rounded-lg bg-muted/10 space-y-4">
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
                                                name="pane_material_id" // Needs to be added to type if missing
                                                value={formData.pane_material_id || 1}
                                                onChange={handleChange}
                                                options={[
                                                    { value: 1, label: 'Beton' }, // Hardcoded for now, should fetch
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

                             {/* Right Side: Pressure & Results */}
                             <div className="space-y-6">
                                <div className="p-4 border rounded-lg bg-muted/10 space-y-4">
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

                                {/* Status Box */}
                                <div className={cn(
                                    "p-6 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-colors duration-300",
                                    calculated.satisfies
                                        ? "bg-green-50 border-green-500/50 text-green-900"
                                        : "bg-red-50 border-red-500/50 text-red-900"
                                )}>
                                    <span className="text-sm uppercase tracking-widest font-semibold mb-1 opacity-70">
                                        Rezultat
                                    </span>
                                    <span className="text-3xl font-black tracking-tight">
                                        {calculated.satisfies ? 'ZADOVOLJAVA' : 'NE ZADOVOLJAVA'}
                                    </span>
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
                    </div>
                )}
            </div>
        </div>
    );
};
