import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { examinerService } from '../../services/examinerService';
import { customerService } from '../../services/customerService';
import { constructionService } from '../../services/constructionService';
import type { Appointment, Profile, Customer, Construction } from '../../types';
import { Loader2 } from 'lucide-react';
import { ConfirmDeleteAppointmentDialog } from './ConfirmDeleteAppointmentDialog';

interface AppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: Partial<Appointment> | null;
    selectedSlot?: { start: Date; end: Date } | null;
    onSave: (appointment: Partial<Appointment>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

export const AppointmentDialog = ({
    open,
    onOpenChange,
    appointment,
    selectedSlot,
    onSave,
    onDelete
}: AppointmentDialogProps) => {
    const { t } = useLanguage();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [examiners, setExaminers] = useState<Profile[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [constructions, setConstructions] = useState<Construction[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [formData, setFormData] = useState<Partial<Appointment> & { assignee_ids: string[] }>({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        assignee_ids: [],
        customer_id: '',
        construction_id: '',
        status: 'pending'
    });

    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        if (open) {
            loadData();
            if (appointment) {
                setFormData({
                    ...appointment,
                    start_time: appointment.start_time ? new Date(appointment.start_time).toISOString().slice(0, 16) : '',
                    end_time: appointment.end_time ? new Date(appointment.end_time).toISOString().slice(0, 16) : '',
                    assignee_ids: appointment.assignees?.map(a => a.id) || []
                });
            } else {
                // Default new appointment
                const startTime = selectedSlot ? selectedSlot.start : new Date();
                const endTime = selectedSlot ? selectedSlot.end : new Date(Date.now() + 60 * 60 * 1000);

                setFormData({
                    title: '',
                    description: '',
                    start_time: startTime.toISOString().slice(0, 16),
                    end_time: endTime.toISOString().slice(0, 16),
                    assignee_ids: profile ? [profile.id] : [],
                    status: 'pending'
                });
            }
        }
    }, [open, appointment, selectedSlot, profile]);

    const loadData = async () => {
        try {
            const [examinersData, customersData] = await Promise.all([
                examinerService.getExaminers(),
                customerService.getAll()
            ]);
            setExaminers(examinersData);
            setCustomers(customersData);
        } catch (error) {
            console.error('Failed to load data', error);
        }
    };

    // Load constructions when customer changes
    useEffect(() => {
        if (formData.customer_id) {
            loadConstructions(formData.customer_id);
        } else {
            setConstructions([]);
        }
    }, [formData.customer_id]);

    const loadConstructions = async (customerId: string) => {
        try {
            const data = await constructionService.getByCustomerId(customerId);
            setConstructions(data);
        } catch (error) {
            console.error('Failed to load constructions', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                ...formData,
                start_time: new Date(formData.start_time!).toISOString(),
                end_time: new Date(formData.end_time!).toISOString()
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!appointment?.id || !onDelete) return;

        setLoading(true);
        try {
            await onDelete(appointment.id);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAssignee = (examinerId: string) => {
        setFormData(prev => {
            const current = prev.assignee_ids || [];
            if (current.includes(examinerId)) {
                return { ...prev, assignee_ids: current.filter(id => id !== examinerId) };
            } else {
                return { ...prev, assignee_ids: [...current, examinerId] };
            }
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader onClose={() => onOpenChange(false)}>
                        <DialogTitle>
                            {appointment?.id ? t('calendar.editEvent') : t('calendar.newEvent')}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{t('calendar.eventTitle')}</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start">{t('calendar.start')}</Label>
                                <Input
                                    id="start"
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">{t('calendar.end')}</Label>
                                <Input
                                    id="end"
                                    type="datetime-local"
                                    value={formData.end_time}
                                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('calendar.examiners')}</Label>
                            <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                                {examiners.map(ex => (
                                    <div key={ex.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`examiner-${ex.id}`}
                                            checked={formData.assignee_ids?.includes(ex.id)}
                                            onChange={() => toggleAssignee(ex.id)}
                                            disabled={!isAdmin && ex.id !== profile?.id} // Non-admins can only assign themselves? Or maybe just view? Let's allow assigning themselves.
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor={`examiner-${ex.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {ex.name} {ex.last_name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {!isAdmin && <p className="text-xs text-muted-foreground">{t('calendar.adminOnlyAssign')}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customer">{t('calendar.customer')} {t('common.optional')}</Label>
                            <select
                                id="customer"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.customer_id || ''}
                                onChange={e => setFormData({ ...formData, customer_id: e.target.value, construction_id: '' })}
                            >
                                <option value="">{t('common.select')}</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {formData.customer_id && (
                            <div className="space-y-2">
                                <Label htmlFor="construction">{t('calendar.construction')} {t('common.optional')}</Label>
                                <select
                                    id="construction"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.construction_id || ''}
                                    onChange={e => setFormData({ ...formData, construction_id: e.target.value })}
                                >
                                    <option value="">{t('common.select')}</option>
                                    {constructions.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.work_order})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description">{t('calendar.description')} {t('common.optional')}</Label>
                            <textarea
                                id="description"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            {appointment?.id && onDelete && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDeleteClick}
                                    disabled={loading}
                                    className="w-full sm:w-auto sm:mr-auto"
                                >
                                    {t('common.delete')}
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('common.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteAppointmentDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                appointment={appointment}
            />
        </>
    );
};
