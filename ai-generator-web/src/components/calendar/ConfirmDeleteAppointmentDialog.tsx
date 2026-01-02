import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import type { Appointment } from '../../types';

interface ConfirmDeleteAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    appointment: Partial<Appointment> | null;
}

export const ConfirmDeleteAppointmentDialog = ({
    open,
    onOpenChange,
    onConfirm,
    appointment,
}: ConfirmDeleteAppointmentDialogProps) => {
    const { t } = useLanguage();

    if (!appointment) return null;

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
                                {t('calendar.deleteDialogTitle') || 'Confirm Deletion'}
                            </DialogTitle>
                            <div className="text-sm text-muted-foreground space-y-3">
                                <p>
                                    {t('calendar.deleteDialogMessage') || 'Are you sure you want to delete this appointment?'}
                                </p>
                                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        {t('calendar.eventTitle')}:
                                    </p>
                                    <p className="font-semibold text-foreground">{appointment.title}</p>

                                    {appointment.start_time && (
                                        <>
                                            <p className="text-xs text-muted-foreground mt-2 mb-1">
                                                {t('calendar.start')}:
                                            </p>
                                            <p className="font-semibold text-foreground">
                                                {new Date(appointment.start_time).toLocaleString()}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <p className="text-destructive font-medium">
                                    {t('calendar.deleteWarning') || 'This action cannot be undone.'}
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
