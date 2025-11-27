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
import { Loader2, Plus, Trash2 } from 'lucide-react';
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
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState<Partial<Appointment> & { assignee_ids: string[] }>({
        title: '',
        description: '',
        start: '',
        end: '',
        assignee_ids: [],
        customer_id: '',
        construction_id: '',
        location: '',
        reminder_enabled: false,
        reminder_times: []
    });

    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        if (open) {
            loadData();
            if (appointment) {
                // Existing appointment: Start in view mode
                setIsEditing(false);
                setFormData({
                    ...appointment,
                    start: appointment.start ? new Date(appointment.start).toISOString().slice(0, 16) : '',
                    end: appointment.end ? new Date(appointment.end).toISOString().slice(0, 16) : '',
                    assignee_ids: appointment.examiner_ids || [],
                    location: appointment.location || '',
                    reminder_enabled: appointment.reminder_enabled || false,
                    reminder_times: appointment.reminder_times || []
                });
            } else {
                // New appointment: Start in edit mode
                setIsEditing(true);

                // Default new appointment - STRICT 30 minute duration
                // We ignore selectedSlot.end to enforce the 30min rule requested by user
                const startTime = selectedSlot ? selectedSlot.start : new Date();
                const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

                setFormData({
                    title: '',
                    description: '',
                    start: startTime.toISOString().slice(0, 16),
                    end: endTime.toISOString().slice(0, 16),
                    assignee_ids: profile ? [profile.id] : [],
                    location: '',
                    reminder_enabled: false,
                    reminder_times: []
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

    // Auto-fill location when construction changes
    useEffect(() => {
        if (formData.construction_id && constructions.length > 0) {
            const selectedConstruction = constructions.find(c => c.id === formData.construction_id);
            if (selectedConstruction?.location && !formData.location) {
                setFormData(prev => ({
                    ...prev,
                    location: selectedConstruction.location || ''
                }));
            }
        }
    }, [formData.construction_id, constructions]);

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
                start: new Date(formData.start!).toISOString(),
                end: new Date(formData.end!).toISOString(),
                examiner_ids: formData.assignee_ids
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

    const addReminder = () => {
        setFormData(prev => ({
            ...prev,
            reminder_times: [...(prev.reminder_times || []), { minutes_before: 30, type: 'notification' }]
        }));
    };

    const removeReminder = (index: number) => {
        setFormData(prev => ({
            ...prev,
            reminder_times: (prev.reminder_times || []).filter((_, i) => i !== index)
        }));
    };

    const updateReminder = (index: number, minutes: number) => {
        setFormData(prev => ({
            ...prev,
            reminder_times: (prev.reminder_times || []).map((r, i) =>
                i === index ? { ...r, minutes_before: minutes } : r
            )
        }));
    };

    const getAssigneeNames = () => {
        return examiners
            .filter(ex => formData.assignee_ids?.includes(ex.id))
            .map(ex => `${ex.name} ${ex.last_name}`)
            .join(', ');
    };

    const getCustomerName = () => {
        return customers.find(c => c.id === formData.customer_id)?.name || '';
    };

    const getConstructionName = () => {
        return constructions.find(c => c.id === formData.construction_id)?.name || '';
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader onClose={() => onOpenChange(false)}>
                        <DialogTitle>
                            {appointment?.id
                                ? (isEditing ? t('calendar.editEvent') : formData.title)
                                : t('calendar.newEvent')}
                        </DialogTitle>
                    </DialogHeader>

                    {!isEditing ? (
                        // VIEW MODE
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <Label className="text-muted-foreground">{t('calendar.start')}</Label>
                                    <p>{formData.start ? new Date(formData.start).toLocaleString() : '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">{t('calendar.end')}</Label>
                                    <p>{formData.end ? new Date(formData.end).toLocaleString() : '-'}</p>
                                </div>
                                {formData.location && (
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground">{t('calendar.location')}</Label>
                                        <p>{formData.location}</p>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <Label className="text-muted-foreground">{t('calendar.examiners')}</Label>
                                    <p>{getAssigneeNames() || '-'}</p>
                                </div>
                                {formData.customer_id && (
                                    <div>
                                        <Label className="text-muted-foreground">{t('calendar.customer')}</Label>
                                        <p>{getCustomerName()}</p>
                                    </div>
                                )}
                                {formData.construction_id && (
                                    <div>
                                        <Label className="text-muted-foreground">{t('calendar.construction')}</Label>
                                        <p>{getConstructionName()}</p>
                                    </div>
                                )}
                                {formData.description && (
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground">{t('calendar.description')}</Label>
                                        <p className="whitespace-pre-wrap">{formData.description}</p>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <Label className="text-muted-foreground">{t('calendar.reminders')}</Label>
                                    <p>
                                        {formData.reminder_enabled
                                            ? (formData.reminder_times?.map(r => `${r.minutes_before} min`).join(', ') || '-')
                                            : t('common.no')}
                                    </p>
                                </div>
                            </div>

                            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4">
                                {onDelete && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDeleteClick}
                                        className="w-full sm:w-auto sm:mr-auto"
                                    >
                                        {t('common.delete')}
                                    </Button>
                                )}
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                                    {t('common.close')}
                                </Button>
                                <Button type="button" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                                    {t('common.edit')}
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        // EDIT MODE
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
                                        value={formData.start}
                                        onChange={e => setFormData({ ...formData, start: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end">{t('calendar.end')}</Label>
                                    <Input
                                        id="end"
                                        type="datetime-local"
                                        value={formData.end}
                                        onChange={e => setFormData({ ...formData, end: e.target.value })}
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
                                                disabled={!isAdmin && ex.id !== profile?.id}
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
                                <Label htmlFor="location">{t('calendar.location')} {t('common.optional')}</Label>
                                <Input
                                    id="location"
                                    value={formData.location || ''}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder={t('calendar.locationPlaceholder') || 'Enter location'}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('calendar.locationHint') || 'Auto-filled from construction site'}
                                </p>
                            </div>

                            <div className="space-y-4 border rounded-md p-3">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="reminder_enabled"
                                        checked={formData.reminder_enabled}
                                        onChange={e => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="reminder_enabled">{t('calendar.enableReminders')}</Label>
                                </div>

                                {formData.reminder_enabled && (
                                    <div className="space-y-2 pl-6">
                                        {formData.reminder_times?.map((reminder, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={reminder.minutes_before}
                                                    onChange={e => updateReminder(index, parseInt(e.target.value) || 0)}
                                                    className="w-24"
                                                />
                                                <span className="text-sm text-muted-foreground">{t('calendar.minutesBefore')}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeReminder(index)}
                                                    className="h-8 w-8 text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addReminder}
                                            className="mt-2"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            {t('calendar.addReminder')}
                                        </Button>
                                    </div>
                                )}
                            </div>

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
                                {appointment?.id && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        className="w-full sm:w-auto sm:mr-auto"
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                )}
                                {!appointment?.id && (
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                                        {t('common.cancel')}
                                    </Button>
                                )}
                                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('common.save')}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
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
