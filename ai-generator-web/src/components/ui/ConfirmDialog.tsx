import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './Dialog';
import { Button } from './Button';

interface ConfirmDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    description?: string;
    children?: React.ReactNode;
    icon?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
    confirmClassName?: string;
    loading?: boolean;
}

export const ConfirmDialog = ({
    open,
    onConfirm,
    onCancel,
    title,
    description,
    children,
    icon,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'destructive',
    confirmClassName,
    loading = false,
}: ConfirmDialogProps) => {
    const defaultIcon = (
        <AlertTriangle aria-hidden="true" className={`h-6 w-6 ${
            variant === 'destructive' ? 'text-destructive' : 'text-primary'
        }`} />
    );

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
            <DialogContent className="sm:max-w-md" role="alertdialog">
                <DialogHeader onClose={onCancel}>
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                            variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'
                        }`}>
                            {icon || defaultIcon}
                        </div>
                        <div className="flex-1 space-y-2">
                            <DialogTitle>{title}</DialogTitle>
                            {description && (
                                <p className="text-sm text-muted-foreground">{description}</p>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {children && (
                    <div className="text-sm text-muted-foreground">
                        {children}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="w-full sm:w-auto"
                        disabled={loading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        className={confirmClassName ? `w-full sm:w-auto ${confirmClassName}` : 'w-full sm:w-auto'}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
