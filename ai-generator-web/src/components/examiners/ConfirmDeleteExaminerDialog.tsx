import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import type { Profile } from '../../types';

interface ConfirmDeleteExaminerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    examiner: Profile | null;
}

export const ConfirmDeleteExaminerDialog = ({
    open,
    onOpenChange,
    onConfirm,
    examiner,
}: ConfirmDeleteExaminerDialogProps) => {
    const { t } = useLanguage();

    if (!examiner) return null;

    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

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
                                {t('examiners.deleteDialogTitle') || 'Confirm Deletion'}
                            </DialogTitle>
                            <div className="text-sm text-muted-foreground space-y-3">
                                <p>
                                    {t('examiners.deleteDialogMessage') || 'Are you sure you want to delete this examiner?'}
                                </p>
                                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        {t('examiners.fullName')}:
                                    </p>
                                    <p className="font-semibold text-foreground">
                                        {examiner.name} {examiner.last_name} {examiner.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 mb-1">
                                        {t('examiners.username')}:
                                    </p>
                                    <p className="font-semibold text-foreground">@{examiner.username}</p>
                                    <p className="text-xs text-muted-foreground mt-2 mb-1">
                                        {t('examiners.email')}:
                                    </p>
                                    <p className="font-semibold text-foreground">{examiner.email}</p>
                                </div>
                                <p className="text-destructive font-medium">
                                    {t('examiners.deleteWarning') || 'This action cannot be undone.'}
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
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        className="w-full sm:w-auto"
                    >
                        {t('common.delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
