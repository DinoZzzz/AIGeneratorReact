import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { constructionService } from '../services/constructionService';
import { customerService } from '../services/customerService';
import { Input } from '../components/ui/Input';
import { Loader2, Save, ArrowLeft, FileText } from 'lucide-react';
import type { Construction, Customer } from '../types';
import { useLanguage } from '../context/LanguageContext';

const initialState: Partial<Construction> = {
    name: '',
    work_order: '',
    location: '',
};

export const ConstructionForm = () => {
    const { customerId, id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Construction>>(initialState);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { t } = useLanguage();

    useEffect(() => {
        if (customerId) {
            loadCustomer(customerId);
        }
        if (id && id !== 'new') {
            loadConstruction(id);
        }
    }, [customerId, id]);

    const loadCustomer = async (custId: string) => {
        try {
            const data = await customerService.getById(custId);
            setCustomer(data);
        } catch (error) {
            console.error('Failed to load customer', error);
        }
    };

    const loadConstruction = async (constId: string) => {
        setLoading(true);
        try {
            const data = await constructionService.getById(constId);
            setFormData(data);
        } catch (error) {
            console.error('Failed to load construction', error);
            alert('Failed to load construction');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = async () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        if (!formData.name?.trim()) {
            newErrors.name = t('constructions.name');
            isValid = false;
        }

        if (!formData.work_order?.trim()) {
            newErrors.work_order = t('constructions.workOrder');
            isValid = false;
        } else if (customerId) {
            const workOrderExists = await constructionService.checkWorkOrderExists(
                formData.work_order,
                customerId,
                id === 'new' ? undefined : id
            );
            if (workOrderExists) {
                newErrors.work_order = t('constructions.workOrder');
                isValid = false;
            }
        }

        if (!formData.location?.trim()) {
            newErrors.location = t('constructions.location');
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId) return;

        setLoading(true);
        try {
            if (await validate()) {
                const dataToSave = {
                    ...formData,
                    customer_id: customerId
                };

                if (id && id !== 'new') {
                    await constructionService.update(id, dataToSave);
                } else {
                    await constructionService.create(dataToSave);
                }
                navigate(`/customers/${customerId}/constructions`);
            }
        } catch (error) {
            console.error('Failed to save construction', error);
            alert('Failed to save construction');
        } finally {
            setLoading(false);
        }
    };

    if (loading && id && id !== 'new') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">{t('constructions.loading')}</span>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(`/customers/${customerId}/constructions`)}
                        className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {id === 'new' ? t('constructions.newTitle') : t('constructions.editTitle')}
                        </h1>
                        {customer && <p className="text-sm text-muted-foreground">{t('constructions.for')} {customer.name}</p>}
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                        {t('constructions.save')}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card shadow rounded-lg p-6 border border-border">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <Input
                            label={t('constructions.workOrder')}
                            name="work_order"
                            value={formData.work_order}
                            onChange={handleChange}
                            placeholder={t('constructions.placeholderWork')}
                        />
                        {errors.work_order && <p className="mt-1 text-sm text-red-600">{errors.work_order}</p>}
                    </div>

                    <div>
                        <Input
                            label={t('constructions.name')}
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={t('constructions.placeholderName')}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <Input
                            label={t('constructions.location')}
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder={t('constructions.placeholderLocation')}
                        />
                        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                    </div>
                </div>
            </form>
        </div>
    );
};
