import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';

interface ConfirmDeleteMaterialDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    materialName: string;
    materialType: 'shaft' | 'pipe';
}

export const ConfirmDeleteMaterialDialog = ({
    open,
    onOpenChange,
    onConfirm,
    materialName,
    materialType,
}: ConfirmDeleteMaterialDialogProps) => {
    const { t } = useLanguage();

    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    const materialTypeLabel = materialType === 'shaft'
        ? t('materials.shaftSingular') || 'material for shaft'
        : t('materials.pipeSingular') || 'material for pipe';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader onClose={handleCancel}>
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <DialogTitle>
                                {t('materials.deleteDialogTitle') || 'Confirm Deletion'}
                            </DialogTitle>
                            <div className="text-sm text-muted-foreground space-y-3">
                                <p>
                                    {t('materials.deleteDialogMessage') || 'Are you sure you want to delete this material?'}
                                </p>
                                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        {t('materials.materialType') || 'Material type'}:
                                    </p>
                                    <p className="font-semibold text-foreground">{materialTypeLabel}</p>
                                    <p className="text-xs text-muted-foreground mt-2 mb-1">
                                        {t('materials.materialName') || 'Material name'}:
                                    </p>
                                    <p className="font-semibold text-foreground">{materialName}</p>
                                </div>
                                <p className="text-destructive font-medium">
                                    {t('materials.deleteWarning') || 'This action cannot be undone.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="w-full sm:w-auto"
                    >
                        {t('materials.cancel') || 'Cancel'}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        className="w-full sm:w-auto"
                    >
                        {t('materials.confirmDelete') || 'Delete Material'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
