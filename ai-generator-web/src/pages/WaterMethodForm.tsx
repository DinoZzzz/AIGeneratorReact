import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Loader2, Save, ArrowLeft, FileDown, ArrowRight } from 'lucide-react';
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
    examination_date: new Date().toISOString().split('T')[0],
    examination_duration: '30:00', // Default 30 min for water
    stock: '',
    remark: '',
    deviation: '',
    depositional_height: 0,
    pipeline_slope: 0
};

interface ExaminationProcedure {
    id: number;
    name: string;
}

interface CalculatedResults {
    waterLoss: number;
    waterVolumeLoss: number;
    totalWettedArea: number;
    wettedShaftSurface: number;
    wettedPipeSurface: number;
    allowedLossL: number;
    allowedLossMm: number;
    result: number;
    satisfies: boolean;
    hydrostaticHeight: number;
}

const NUMERIC_FIELDS = [
    'type_id', 'draft_id', 'material_type_id', 'pane_material_id', 'examination_procedure_id',
    'temperature', 'pipe_length', 'pipe_diameter', 'pane_width', 'pane_length',
    'water_height', 'water_height_start', 'water_height_end',
    'pressure_start', 'pressure_end', 'pane_diameter',
    'customer_id', 'construction_id', 'ordinal', 'depositional_height', 'pipeline_slope'
];

export const WaterMethodForm = () => {
    const { id, customerId, constructionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ReportForm>>(initialState);
    const [procedures, setProcedures] = useState<ExaminationProcedure[]>([]);
    const [activeTab, setActiveTab] = useState<'page1' | 'page2'>('page1');

    // Derived state
    const [calculated, setCalculated] = useState<CalculatedResults>({
        waterLoss: 0,
        waterVolumeLoss: 0,
        totalWettedArea: 0,
        wettedShaftSurface: 0,
        wettedPipeSurface: 0,
        allowedLossL: 0,
        allowedLossMm: 0,
        result: 0,
        satisfies: false,
        hydrostaticHeight: 0
    });

    useEffect(() => {
        loadProcedures();
        if (id && id !== 'new') {
            loadReport(id);
        }
    }, [id]);

    useEffect(() => {
        // Recalculate whenever form data changes
        const form = formData as ReportForm;
        const results = calc.calculateWaterReport(form);

        // Extra calculations not returned by calculateWaterReport wrapper
        const hydrostaticHeight = calc.calculateHydrostaticHeight(
            form.draft_id,
            form.water_height,
            form.pipe_diameter,
            form.depositional_height
        );

        const wettedPipe = calc.calculateWettedPipeSurface(form.draft_id, form.pipe_diameter, form.pipe_length);
        const wettedShaft = calc.calculateWettedShaftSurface(form.draft_id, form.material_type_id, form.water_height, form.pane_diameter, form.pane_width, form.pane_length);
        const allowedLossMm = calc.calculateAllowedLossMm(results.allowedLossL, form.material_type_id, form.pane_diameter, form.pane_width, form.pane_length);

        setCalculated({
            ...results,
            hydrostaticHeight,
            wettedPipeSurface: wettedPipe,
            wettedShaftSurface: wettedShaft,
            allowedLossMm
        });

        // Auto-fill deviation text logic from WaterMethodForm.cs
        // if (hydrostaticHeight < 100 && draftId == 2)
        // Hydrostatic height in calc is in meters, C# checks cm (100cm = 1m)
        const deviationTarget = "Kod pojedinih dionica h2<100cm";
        if (hydrostaticHeight < 1.0 && form.draft_id === 2) {
             if (form.deviation !== deviationTarget) {
                 setFormData(prev => ({ ...prev, deviation: deviationTarget }));
             }
        } else if (form.deviation === deviationTarget) {
             setFormData(prev => ({ ...prev, deviation: "" }));
        }

    }, [formData]);

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
                type_id: 1 // Ensure it's water type
            };

            if (id === 'new') {
                await reportService.create(dataToSave as ReportForm);
            } else {
                await reportService.update(id!, dataToSave as ReportForm);
            }

            if (createNext) {
                 setFormData({
                    ...initialState,
                    customer_id: dataToSave.customer_id,
                    construction_id: dataToSave.construction_id,
                    examination_date: dataToSave.examination_date,
                    // keep other relevant fields if needed
                });
                setActiveTab('page1');
                navigate(`/customers/${customerId}/constructions/${constructionId}/reports/new/water`);
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
    const showGullyFields = formData.draft_id === 8; // 8 = Gully (assumed based on old app logic)

    if (loading && id && id !== 'new') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
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
                        <p className="text-sm text-muted-foreground">Metoda 1610 - Voda</p>
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
                                        // Add other drafts if needed like Slivnik
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
                             {/* Left Side */}
                             <div className="space-y-6">
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

                                    {formData.material_type_id === 1 ? (
                                        <Input
                                            label="Promjer okna (m)"
                                            type="number"
                                            step="0.01"
                                            name="pane_diameter"
                                            value={formData.pane_diameter}
                                            onChange={handleChange}
                                        />
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Širina okna (m)"
                                                type="number"
                                                step="0.01"
                                                name="pane_width"
                                                value={formData.pane_width}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="Dužina okna (m)"
                                                type="number"
                                                step="0.01"
                                                name="pane_length"
                                                value={formData.pane_length}
                                                onChange={handleChange}
                                            />
                                        </div>
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

                                <div className="p-4 border rounded-lg bg-muted/10 space-y-4">
                                     <h3 className="font-medium text-primary">Nivoi i Mjerenja</h3>
                                     <Input
                                        label="Visina vode (m)"
                                        type="number"
                                        step="0.01"
                                        name="water_height"
                                        value={formData.water_height}
                                        onChange={handleChange}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Voda početak (mm)"
                                            type="number"
                                            step="0.01"
                                            name="water_height_start"
                                            value={formData.water_height_start}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            label="Voda kraj (mm)"
                                            type="number"
                                            step="0.01"
                                            name="water_height_end"
                                            value={formData.water_height_end}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-sm text-muted-foreground">Gubitak vode:</span>
                                        <span className="font-medium">{calculated.waterLoss.toFixed(2)} mm</span>
                                    </div>
                                </div>
                             </div>

                             {/* Right Side */}
                             <div className="space-y-6">
                                <div className="p-4 border rounded-lg bg-muted/10 space-y-3 text-sm">
                                    <h3 className="font-medium text-primary mb-2">Detaljni Izračuni</h3>

                                    <ResultRow label="Gubitak volumena" value={`${calculated.waterVolumeLoss.toFixed(4)} l`} />
                                    <ResultRow label="Omočena površ. cijevi" value={`${calculated.wettedPipeSurface.toFixed(2)} m²`} />
                                    <ResultRow label="Omočena površ. okna" value={`${calculated.wettedShaftSurface.toFixed(2)} m²`} />
                                    <ResultRow label="Ukupna omočena površ." value={`${calculated.totalWettedArea.toFixed(2)} m²`} highlight />

                                    <div className="border-t my-2 pt-2">
                                        <ResultRow label="Dozvoljeni gubitak (l)" value={`${calculated.allowedLossL.toFixed(2)} l`} />
                                        <ResultRow label="Dozvoljeni gubitak (mm)" value={`${calculated.allowedLossMm.toFixed(2)} mm`} />
                                    </div>

                                    <div className="border-t my-2 pt-2">
                                         <ResultRow label="Hidrostatska visina" value={`${(calculated.hydrostaticHeight * 100).toFixed(2)} cm`} />
                                    </div>
                                </div>

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

                                <div className={cn(
                                    "p-6 rounded-xl border-2 flex flex-col items-center justify-center text-center",
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
                                    <span className="text-lg mt-2 font-mono">
                                        {calculated.result.toFixed(2)} l/m²
                                    </span>
                                </div>
                             </div>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ResultRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div className="flex justify-between items-center">
        <span className={cn(highlight ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
        <span className={cn("font-medium", highlight ? "text-primary" : "text-foreground")}>{value}</span>
    </div>
);
