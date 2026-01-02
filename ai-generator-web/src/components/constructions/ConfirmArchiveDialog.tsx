import { Archive, ArchiveRestore } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import type { Construction } from '../../types';

interface ConfirmArchiveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    construction: Construction | null;
    isArchiving: boolean; // true = archiving, false = unarchiving
    loading?: boolean;
}

export const ConfirmArchiveDialog = ({
    open,
    onOpenChange,
    onConfirm,
    construction,
    isArchiving,
    loading = false,
}: ConfirmArchiveDialogProps) => {
    const { t } = useLanguage();

    if (!construction) return null;

    const handleConfirm = () => {
        onConfirm();
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader onClose={handleCancel}>
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isArchiving ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            {isArchiving ? (
                                <Archive className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            ) : (
                                <ArchiveRestore className="h-6 w-6 text-green-600 dark:text-green-400" />
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <DialogTitle>
                                {isArchiving
                                    ? t('constructions.archiveConfirmTitle')
                                    : t('constructions.unarchiveConfirmTitle')
                                }
                            </DialogTitle>
                            <div className="text-sm text-muted-foreground space-y-3">
                                <p>
                                    {isArchiving
                                        ? t('constructions.archiveConfirmMessage')
                                        : t('constructions.unarchiveConfirmMessage')
                                    }
                                </p>
                                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        {t('constructions.name')}:
                                    </p>
                                    <p className="font-semibold text-foreground">
                                        {construction.name}
                                    </p>
                                    {construction.work_order && (
                                        <>
                                            <p className="text-xs text-muted-foreground mt-2 mb-1">
                                                {t('constructions.workOrder')}:
                                            </p>
                                            <p className="font-semibold text-foreground">{construction.work_order}</p>
                                        </>
                                    )}
                                    {construction.location && (
                                        <>
                                            <p className="text-xs text-muted-foreground mt-2 mb-1">
                                                {t('constructions.location')}:
                                            </p>
                                            <p className="font-semibold text-foreground">{construction.location}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="w-full sm:w-auto"
                        disabled={loading}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant={isArchiving ? 'default' : 'default'}
                        onClick={handleConfirm}
                        className={`w-full sm:w-auto ${isArchiving ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        loading={loading}
                    >
                        {isArchiving ? t('constructions.archive') : t('constructions.unarchive')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
