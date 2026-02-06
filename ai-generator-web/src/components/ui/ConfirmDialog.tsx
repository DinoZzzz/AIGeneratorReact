import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './Dialog';
import { Button } from './Button';

interface ConfirmDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
}

export const ConfirmDialog = ({
    open,
    onConfirm,
    onCancel,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'destructive',
}: ConfirmDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader onClose={onCancel}>
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                            variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'
                        }`}>
                            <AlertTriangle className={`h-6 w-6 ${
                                variant === 'destructive' ? 'text-destructive' : 'text-primary'
                            }`} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <DialogTitle>{title}</DialogTitle>
                            {description && (
                                <p className="text-sm text-muted-foreground">{description}</p>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="w-full sm:w-auto"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        className="w-full sm:w-auto"
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
