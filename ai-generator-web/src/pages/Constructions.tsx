import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { constructionService } from '../services/constructionService';
import { customerService } from '../services/customerService';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import type { Construction, Customer } from '../types';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

export const Constructions = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const [constructions, setConstructions] = useState<Construction[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (customerId) {
            loadData(customerId);
        }
    }, [customerId]);

    const loadData = async (id: string) => {
        setLoading(true);
        try {
            const [customerData, constructionsData] = await Promise.all([
                customerService.getById(id),
                constructionService.getByCustomerId(id)
            ]);
            setCustomer(customerData);
            setConstructions(constructionsData);
        } catch (error) {
            console.error('Failed to load data', error);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this construction site? This will also delete all associated reports.')) {
            try {
                await constructionService.delete(id);
                if (customerId) {
                    loadData(customerId);
                }
            } catch (error) {
                console.error('Failed to delete construction', error);
                alert('Failed to delete construction');
            }
        }
    };

    const filteredConstructions = constructions.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.work_order?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!customer) {
        return <div>Customer not found</div>;
    }

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[
                { label: 'Customers', path: '/customers' },
                { label: customer.name, path: '/customers' },
                { label: 'Constructions' }
            ]} />

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/customers')}
                        className="p-2 rounded-full hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Construction Sites</h1>
                        <p className="text-sm text-gray-500">for {customer.name}</p>
                    </div>
                </div>
                <Link
                    to={`/customers/${customerId}/constructions/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    New Construction
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="Search constructions..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredConstructions.map((construction) => (
                            <tr key={construction.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {construction.work_order}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {construction.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {construction.location}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <Link
                                        to={`/customers/${customerId}/constructions/${construction.id}`}
                                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                        title="Edit"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(construction.id)}
                                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredConstructions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No construction sites found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
