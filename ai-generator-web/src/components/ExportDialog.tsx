import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import type { User, ReportForm } from '../types';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (data: ExportMetaData, selectedReports?: ReportForm[]) => void;
    certifiers?: User[]; // Assuming we might fetch these, or user enters name
    loading?: boolean;
    defaultValues?: Partial<ExportMetaData>;
    reports?: ReportForm[]; // Optional: if provided, allows selection inside dialog
}

export interface ExportMetaData {
    constructionPart: string;
    drainage: string;
    airRemark: string;
    airDeviation: string;
    waterRemark: string;
    waterDeviation: string;
    certifierName: string;
}

export const ExportDialog = ({ open, onOpenChange, onConfirm, loading = false, defaultValues, reports }: ExportDialogProps) => {
    const [data, setData] = useState<ExportMetaData>({
        constructionPart: defaultValues?.constructionPart || '',
        drainage: defaultValues?.drainage || '',
        airRemark: defaultValues?.airRemark || '',
        airDeviation: defaultValues?.airDeviation || '',
        waterRemark: defaultValues?.waterRemark || '',
        waterDeviation: defaultValues?.waterDeviation || '',
        certifierName: defaultValues?.certifierName || '',
    });

    const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());

    // Update state when defaultValues change or dialog opens
    useEffect(() => {
        if (open) {
            if (defaultValues && data.constructionPart === '' && defaultValues.constructionPart) {
                setData(prev => ({
                    ...prev,
                    ...defaultValues
                }));
            }
            // If reports are provided, select all by default
            if (reports && reports.length > 0) {
                const allIds = reports.map(r => r.id).filter((id): id is string => !!id);
                setSelectedReportIds(new Set(allIds));
            } else {
                setSelectedReportIds(new Set());
            }
        }
    }, [open, defaultValues, reports]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let selectedReports: ReportForm[] | undefined;
        if (reports && reports.length > 0) {
            if (selectedReportIds.size === 0) {
                alert("Please select at least one report to export.");
                return;
            }
            selectedReports = reports.filter(r => r.id && selectedReportIds.has(r.id));
        }

        onConfirm(data, selectedReports);

        // Don't close immediately if loading, let parent handle it or close after success
        if (!loading) {
            onOpenChange(false);
        }
    };

    const toggleReport = (id: string) => {
        const newSelected = new Set(selectedReportIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedReportIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (!reports) return;
        if (selectedReportIds.size === reports.length) {
            setSelectedReportIds(new Set());
        } else {
            const allIds = reports.map(r => r.id).filter((id): id is string => !!id);
            setSelectedReportIds(new Set(allIds));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Export Report Options</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">

                    {/* Report Selection Section */}
                    {reports && reports.length > 0 && (
                        <div className="border border-border rounded-md p-4 bg-muted/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm text-foreground">Select Reports to Export</h3>
                                <button
                                    type="button"
                                    onClick={toggleSelectAll}
                                    className="text-xs text-primary hover:text-primary/80"
                                >
                                    {selectedReportIds.size === reports.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2 border-t border-border pt-2">
                                {reports.map((report) => (
                                    <div key={report.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`report-${report.id}`}
                                            checked={report.id ? selectedReportIds.has(report.id) : false}
                                            onChange={() => report.id && toggleReport(report.id)}
                                            className="rounded border-input text-primary focus:ring-ring"
                                        />
                                        <label htmlFor={`report-${report.id}`} className="text-sm text-foreground flex-1 truncate cursor-pointer">
                                            <span className="font-medium text-foreground">{report.type_id === 1 ? 'Water' : 'Air'}</span>
                                            <span className="mx-1 text-muted-foreground">-</span>
                                            {(report.dionica || report.stock) && (
                                                <>
                                                    <span className="font-medium text-foreground">{report.dionica || report.stock}</span>
                                                    <span className="mx-1 text-muted-foreground">-</span>
                                                </>
                                            )}
                                            <span className="text-muted-foreground">{new Date(report.examination_date).toLocaleDateString()}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                                {selectedReportIds.size} selected
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Construction Part</label>
                            <input
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.constructionPart}
                                onChange={(e) => setData({ ...data, constructionPart: e.target.value })}
                                placeholder="e.g. Faza 1"
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Drainage</label>
                            <input
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.drainage}
                                onChange={(e) => setData({ ...data, drainage: e.target.value })}
                                placeholder="System type..."
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">Air Method</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Remark</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.airRemark}
                                    onChange={(e) => setData({ ...data, airRemark: e.target.value })}
                                    placeholder="Notes for air method..."
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Deviation</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.airDeviation}
                                    onChange={(e) => setData({ ...data, airDeviation: e.target.value })}
                                    placeholder="Norm deviations..."
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">Water Method</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Remark</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.waterRemark}
                                    onChange={(e) => setData({ ...data, waterRemark: e.target.value })}
                                    placeholder="Notes for water method..."
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Deviation</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.waterDeviation}
                                    onChange={(e) => setData({ ...data, waterDeviation: e.target.value })}
                                    placeholder="Norm deviations..."
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Certifier Name</label>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={data.certifierName}
                            onChange={(e) => setData({ ...data, certifierName: e.target.value })}
                            placeholder="Name of the person certifying..."
                            disabled={loading}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Exporting...' : 'Export Report'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
