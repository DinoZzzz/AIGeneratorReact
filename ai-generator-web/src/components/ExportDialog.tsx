import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import type { User } from '../types';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (data: ExportMetaData) => void;
    certifiers?: User[]; // Assuming we might fetch these, or user enters name
    loading?: boolean;
    defaultValues?: Partial<ExportMetaData>;
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

export const ExportDialog = ({ open, onOpenChange, onConfirm, loading = false, defaultValues }: ExportDialogProps) => {
    const [data, setData] = useState<ExportMetaData>({
        constructionPart: defaultValues?.constructionPart || '',
        drainage: defaultValues?.drainage || '',
        airRemark: defaultValues?.airRemark || '',
        airDeviation: defaultValues?.airDeviation || '',
        waterRemark: defaultValues?.waterRemark || '',
        waterDeviation: defaultValues?.waterDeviation || '',
        certifierName: defaultValues?.certifierName || '',
    });

    // Update state when defaultValues change or dialog opens
    // This is simple but effective for this use case
    if (open && defaultValues && data.constructionPart === '' && defaultValues.constructionPart) {
        setData(prev => ({
            ...prev,
            ...defaultValues
        }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(data);
        // Don't close immediately if loading, let parent handle it or close after success
        if (!loading) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Export Report Options</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
