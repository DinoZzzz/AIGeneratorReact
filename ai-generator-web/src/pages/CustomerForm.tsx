import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { Input } from '../components/ui/Input';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import type { Customer } from '../types';

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
            newErrors.name = 'Name is required';
            isValid = false;
        } else {
            const nameExists = await customerService.checkNameExists(formData.name, id === 'new' ? undefined : id);
            if (nameExists) {
                newErrors.name = 'Customer with this name already exists';
                isValid = false;
            }
        }

        if (!formData.work_order?.trim()) {
            newErrors.work_order = 'Work Order is required';
            isValid = false;
        } else {
            const workOrderExists = await customerService.checkWorkOrderExists(formData.work_order, id === 'new' ? undefined : id);
            if (workOrderExists) {
                newErrors.work_order = 'Customer with this Work Order already exists';
                isValid = false;
            }
        }

        if (!formData.location?.trim()) {
            newErrors.location = 'Location is required';
            isValid = false;
        }

        if (!formData.address?.trim()) {
            newErrors.address = 'Address is required';
            isValid = false;
        }

        if (!formData.postal_code?.trim()) {
            newErrors.postal_code = 'Postal Code is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (await validate()) {
                if (id && id !== 'new') {
                    await customerService.update(id, formData);
                } else {
                    await customerService.create(formData);
                }
                navigate('/customers');
            }
        } catch (error) {
            console.error('Failed to save customer', error);
            alert('Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    if (loading && id && id !== 'new') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/customers')}
                        className="p-2 rounded-full hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {id === 'new' ? 'New Customer' : 'Edit Customer'}
                    </h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                    Save
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <Input
                            label="Work Order"
                            name="work_order"
                            value={formData.work_order}
                            onChange={handleChange}
                            placeholder="e.g., 2023-001"
                        />
                        {errors.work_order && <p className="mt-1 text-sm text-red-600">{errors.work_order}</p>}
                    </div>

                    <div>
                        <Input
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Customer Name"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <Input
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="City / Region"
                        />
                        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                    </div>

                    <div>
                        <Input
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Street Address"
                        />
                        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                    </div>

                    <div>
                        <Input
                            label="Postal Code"
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleChange}
                            placeholder="Postal Code"
                        />
                        {errors.postal_code && <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>}
                    </div>
                </div>
            </form>
        </div>
    );
};
