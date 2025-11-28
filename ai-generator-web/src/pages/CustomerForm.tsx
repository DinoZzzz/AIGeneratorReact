import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers';
import { useOffline } from '../context/OfflineContext';
import { Input } from '../components/ui/Input';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import type { Customer } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getAllFromStore, STORES } from '../lib/offlineDb';

const initialState: Partial<Customer> = {
    name: '',
    work_order: '',
    location: '',
    address: '',
    postal_code: '',
};

export const CustomerForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Customer>>(initialState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { t } = useLanguage();
    const { isOnline } = useOffline();

    useEffect(() => {
        if (id && id !== 'new') {
            loadCustomer(id);
        }
    }, [id]);

    const loadCustomer = async (customerId: string) => {
        setLoading(true);
        try {
            const data = await customerService.getById(customerId);
            setFormData(data);
        } catch (error) {
            console.error('Failed to load customer', error);
            alert('Failed to load customer');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = async () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        if (!formData.name?.trim()) {
            newErrors.name = t('customers.nameRequired') || 'Name is required';
            isValid = false;
        } else if (isOnline) {
            // Only check server-side uniqueness when online
            try {
                const nameExists = await customerService.checkNameExists(formData.name, id === 'new' ? undefined : id);
                if (nameExists) {
                    newErrors.name = t('customers.nameExists') || 'Customer name already exists';
                    isValid = false;
                }
            } catch (error) {
                // Network error - skip server check, allow submission
                console.warn('Could not validate name uniqueness:', error);
            }
        } else {
            // Offline: check against local IndexedDB cache
            try {
                const cachedCustomers = await getAllFromStore<Customer>(STORES.CUSTOMERS);
                const nameExists = cachedCustomers.some(
                    c => c.name?.toLowerCase() === formData.name?.toLowerCase() && c.id !== id
                );
                if (nameExists) {
                    newErrors.name = t('customers.nameExists') || 'Customer name already exists';
                    isValid = false;
                }
            } catch (error) {
                // IndexedDB error - allow submission
                console.warn('Could not check local cache for name:', error);
            }
        }

        if (!formData.work_order?.trim()) {
            newErrors.work_order = t('customers.workOrderRequired') || 'Work order is required';
            isValid = false;
        } else if (isOnline) {
            // Only check server-side uniqueness when online
            try {
                const workOrderExists = await customerService.checkWorkOrderExists(formData.work_order, id === 'new' ? undefined : id);
                if (workOrderExists) {
                    newErrors.work_order = t('customers.workOrderExists') || 'Work order already exists';
                    isValid = false;
                }
            } catch (error) {
                // Network error - skip server check, allow submission
                console.warn('Could not validate work order uniqueness:', error);
            }
        } else {
            // Offline: check against local IndexedDB cache
            try {
                const cachedCustomers = await getAllFromStore<Customer>(STORES.CUSTOMERS);
                const workOrderExists = cachedCustomers.some(
                    c => c.work_order?.toLowerCase() === formData.work_order?.toLowerCase() && c.id !== id
                );
                if (workOrderExists) {
                    newErrors.work_order = t('customers.workOrderExists') || 'Work order already exists';
                    isValid = false;
                }
            } catch (error) {
                // IndexedDB error - allow submission
                console.warn('Could not check local cache for work order:', error);
            }
        }

        if (!formData.location?.trim()) {
            newErrors.location = t('customers.locationRequired') || 'Location is required';
            isValid = false;
        }

        if (!formData.address?.trim()) {
            newErrors.address = t('customers.addressRequired') || 'Address is required';
            isValid = false;
        }

        if (!formData.postal_code?.trim()) {
            newErrors.postal_code = t('customers.postalCodeRequired') || 'Postal code is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const isValid = await validate();
            if (!isValid) {
                setLoading(false);
                return;
            }

            if (id && id !== 'new') {
                await updateMutation.mutateAsync({ id, customer: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
            navigate('/customers');
        } catch (error) {
            console.error('Failed to save customer', error);
            alert('Failed to save customer');
            setLoading(false);
        }
    };

    if (loading && id && id !== 'new') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">{t('customers.loadingForm')}</span>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/customers')}
                        className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl font-bold text-foreground">
                        {id === 'new' ? t('customers.newTitle') : t('customers.editTitle')}
                    </h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                    {t('customers.save')}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card shadow rounded-lg p-6 border border-border">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <Input
                            label={t('customers.workOrder')}
                            name="work_order"
                            value={formData.work_order}
                            onChange={handleChange}
                            placeholder={t('customers.placeholderWork')}
                        />
                        {errors.work_order && <p className="mt-1 text-sm text-red-600">{errors.work_order}</p>}
                    </div>

                    <div>
                        <Input
                            label={t('customers.name')}
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={t('customers.placeholderName')}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <Input
                            label={t('customers.location')}
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder={t('customers.placeholderLocation')}
                        />
                        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                    </div>

                    <div>
                        <Input
                            label={t('customers.address')}
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder={t('customers.placeholderAddress')}
                        />
                        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                    </div>

                    <div>
                        <Input
                            label={t('customers.postalCode')}
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleChange}
                            placeholder={t('customers.placeholderPostal')}
                        />
                        {errors.postal_code && <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>}
                    </div>
                </div>
            </form>
        </div>
    );
};
