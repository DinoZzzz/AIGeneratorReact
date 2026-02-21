import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { examinerService } from '../../services/examinerService';
import { customerService } from '../../services/customerService';
import { constructionService } from '../../services/constructionService';
import type { Appointment, AppointmentPayload, Profile, Customer, Construction } from '../../types';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { isNetworkError } from '../../lib/errorHandler';
import { getAllFromStore, getByIndex, saveManyToStore, STORES } from '../../lib/offlineDb';

interface AppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: Partial<Appointment> | null;
    selectedSlot?: { start: Date; end: Date } | null;
    onSave: (appointment: AppointmentPayload) => Promise<void>;
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
    const { isOnline } = useOffline();
    const [loading, setLoading] = useState(false);
    const [examiners, setExaminers] = useState<Profile[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [constructions, setConstructions] = useState<Construction[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const customerSearchRef = useRef<HTMLDivElement | null>(null);

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
    const filteredCustomers = useMemo(() => {
        const query = customerSearch.trim().toLowerCase();
        if (!query) return customers;

        return customers.filter((customer) => {
            const searchableText = [customer.name, customer.work_order, customer.location]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return searchableText.includes(query);
        });
    }, [customerSearch, customers]);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        const loadData = async () => {
            try {
                if (isOnline) {
                    const [examinersData, customersData] = await Promise.all([
                        examinerService.getExaminers(),
                        customerService.getAll()
                    ]);
                    await saveManyToStore(STORES.CUSTOMERS, customersData);
                    if (!cancelled) {
                        setExaminers(examinersData);
                        setCustomers(customersData);
                    }
                    return;
                }

                const offlineCustomers = await getAllFromStore<Customer>(STORES.CUSTOMERS);
                if (!cancelled) {
                    setExaminers(profile ? [profile] : []);
                    setCustomers(offlineCustomers);
                }
            } catch (error) {
                if (!cancelled) {
                    if (!isNetworkError(error)) {
                        console.error('Failed to load data', error);
                    }
                    const offlineCustomers = await getAllFromStore<Customer>(STORES.CUSTOMERS);
                    setExaminers(profile ? [profile] : []);
                    setCustomers(offlineCustomers);
                }
            }
        };

        loadData();

        if (appointment) {
            // Existing appointment: Start in view mode
            setIsEditing(false);
            setIsCustomerDropdownOpen(false);
            setCustomerSearch(appointment.customer?.name || '');
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
            setIsCustomerDropdownOpen(false);
            setCustomerSearch('');

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

        return () => { cancelled = true; };
    }, [isOnline, open, appointment, profile, selectedSlot]);

    useEffect(() => {
        if (!open || !formData.customer_id) return;

        const selectedCustomer = customers.find(customer => customer.id === formData.customer_id);
        if (selectedCustomer && selectedCustomer.name !== customerSearch) {
            setCustomerSearch(selectedCustomer.name);
        }
    }, [customerSearch, customers, formData.customer_id, open]);

    useEffect(() => {
        if (!open || !isCustomerDropdownOpen) return;

        const handleOutsideClick = (event: MouseEvent) => {
            if (!customerSearchRef.current?.contains(event.target as Node)) {
                setIsCustomerDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isCustomerDropdownOpen, open]);

    // Load constructions when customer changes
    useEffect(() => {
        if (!formData.customer_id) {
            setConstructions([]);
            return;
        }

        let cancelled = false;

        const loadConstructions = async () => {
            try {
                if (isOnline) {
                    const data = await constructionService.getByCustomerId(formData.customer_id!);
                    await saveManyToStore(STORES.CONSTRUCTIONS, data);
                    if (!cancelled) setConstructions(data);
                    return;
                }

                const offlineConstructions = await getByIndex<Construction>(
                    STORES.CONSTRUCTIONS,
                    'customer_id',
                    formData.customer_id!
                );
                if (!cancelled) {
                    setConstructions(offlineConstructions);
                }
            } catch (error) {
                if (!cancelled) {
                    if (!isNetworkError(error)) {
                        console.error('Failed to load constructions', error);
                    }
                    const offlineConstructions = await getByIndex<Construction>(
                        STORES.CONSTRUCTIONS,
                        'customer_id',
                        formData.customer_id!
                    );
                    setConstructions(offlineConstructions);
                }
            }
        };

        loadConstructions();

        return () => { cancelled = true; };
    }, [formData.customer_id, isOnline]);

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
    // formData.location intentionally omitted to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.construction_id, constructions]);

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

    const handleCustomerSearchChange = (value: string) => {
        setCustomerSearch(value);
        setIsCustomerDropdownOpen(true);

        const trimmedValue = value.trim();
        setFormData(prev => {
            if (!trimmedValue) {
                if (!prev.customer_id && !prev.construction_id) return prev;
                return {
                    ...prev,
                    customer_id: '',
                    construction_id: ''
                };
            }

            const exactMatch = customers.find(
                customer => customer.name.toLowerCase() === trimmedValue.toLowerCase()
            );
            if (!exactMatch) {
                if (!prev.customer_id && !prev.construction_id) return prev;
                return {
                    ...prev,
                    customer_id: '',
                    construction_id: ''
                };
            }

            if (prev.customer_id === exactMatch.id) return prev;
            return {
                ...prev,
                customer_id: exactMatch.id,
                construction_id: ''
            };
        });
    };

    const handleCustomerSelect = (customer?: Customer) => {
        setFormData(prev => {
            const nextCustomerId = customer?.id || '';
            const shouldResetConstruction = prev.customer_id !== nextCustomerId;
            return {
                ...prev,
                customer_id: nextCustomerId,
                construction_id: shouldResetConstruction ? '' : (prev.construction_id || '')
            };
        });
        setCustomerSearch(customer?.name || '');
        setIsCustomerDropdownOpen(false);
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
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
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
                                <Label htmlFor="customer-search">{t('calendar.customer')} {t('common.optional')}</Label>
                                <div ref={customerSearchRef} className="relative">
                                    <input
                                        id="customer-search"
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder={t('customers.search')}
                                        value={customerSearch}
                                        onFocus={() => setIsCustomerDropdownOpen(true)}
                                        onChange={(e) => handleCustomerSearchChange(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                setIsCustomerDropdownOpen(false);
                                            }
                                        }}
                                    />

                                    {isCustomerDropdownOpen && (
                                        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-input bg-background shadow-md">
                                            <button
                                                type="button"
                                                className="w-full border-b border-border px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                onClick={() => handleCustomerSelect()}
                                            >
                                                {t('common.select')}
                                            </button>

                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map((customer) => (
                                                    <button
                                                        key={customer.id}
                                                        type="button"
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                                        onClick={() => handleCustomerSelect(customer)}
                                                    >
                                                        <span className="block truncate">{customer.name}</span>
                                                        {customer.work_order && (
                                                            <span className="block text-xs text-muted-foreground">
                                                                {customer.work_order}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                                    {t('customers.none')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
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
                                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
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
                                                    aria-label={t('common.delete')}
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

            {appointment && (
                <ConfirmDialog
                    open={deleteDialogOpen}
                    onConfirm={() => { handleDeleteConfirm(); setDeleteDialogOpen(false); }}
                    onCancel={() => setDeleteDialogOpen(false)}
                    title={t('calendar.deleteDialogTitle') || 'Confirm Deletion'}
                    description={t('calendar.deleteDialogMessage') || 'Are you sure you want to delete this appointment?'}
                    confirmLabel={t('common.delete')}
                    cancelLabel={t('common.cancel')}
                    variant="destructive"
                >
                    <div className="bg-muted/50 p-3 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground mb-1">{t('calendar.eventTitle')}:</p>
                        <p className="font-semibold text-foreground">{appointment.title}</p>
                        {appointment.start_time && (
                            <>
                                <p className="text-xs text-muted-foreground mt-2 mb-1">{t('calendar.start')}:</p>
                                <p className="font-semibold text-foreground">{new Date(appointment.start_time).toLocaleString()}</p>
                            </>
                        )}
                    </div>
                    <p className="text-destructive font-medium mt-3">{t('calendar.deleteWarning') || 'This action cannot be undone.'}</p>
                </ConfirmDialog>
            )}
        </>
    );
};
