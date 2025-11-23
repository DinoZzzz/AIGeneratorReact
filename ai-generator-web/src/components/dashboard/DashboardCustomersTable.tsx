
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

interface ActiveConstruction {
    id: string;
    work_order: string;
    name: string;
}

interface CustomerTableItem {
    id: string;
    work_order: string;
    name: string;
    active_constructions: ActiveConstruction[];
}

export const DashboardCustomersTable = () => {
    const [customers, setCustomers] = useState<CustomerTableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const { t } = useLanguage();

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // NOTE: We removed 'work_order' from customers selection because it might not exist in the DB schema
            // even if it exists in the types. If it does exist, uncomment it.
            // If it doesn't exist, we will default to '-' or use ID if needed.

            // Attempt to select without work_order first to be safe,
            // OR check if we can select it. The error 42703 strongly suggests it's missing.
            // However, constructions usually have work_order.

            let query = supabase
                .from('customers')
                .select(`
                    id,
                    name,
                    work_order,
                    constructions (
                        id,
                        work_order,
                        name,
                        is_active
                    )
                `);

            if (search) {
                // Search by both work_order and name
                query = query.or(`name.ilike.%${search}%,work_order.ilike.%${search}%`);
            }

            query = query.range(0, 49);

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                const formatted: CustomerTableItem[] = data.map((c: any) => {
                    const active = c.constructions
                        ?.filter((con: any) => con.is_active)
                        .map((con: any) => ({
                            id: con.id,
                            work_order: con.work_order || '',
                            name: con.name
                        })) || [];

                    return {
                        id: c.id,
                        work_order: c.work_order || '-',
                        name: c.name,
                        active_constructions: active
                    };
                });
                setCustomers(formatted);
            }

        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (customerId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(customerId)) {
            newExpanded.delete(customerId);
        } else {
            newExpanded.add(customerId);
        }
        setExpandedRows(newExpanded);
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">{t('dashboard.customersTable')}</h2>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder={t('dashboard.search')}
                            className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border-none rounded-md text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Link
                        to="/customers/new"
                        className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('dashboard.addCustomer')}
                    </Link>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.workOrder')}</th>
                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.customer')}</th>
                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">{t('dashboard.activeOrders')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">{t('dashboard.loading')}</td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">{t('dashboard.noCustomers')}</td>
                            </tr>
                        ) : (
                            customers.map((customer) => {
                                const isExpanded = expandedRows.has(customer.id);
                                const hasMany = customer.active_constructions.length > 3;
                                const displayedConstructions = isExpanded
                                    ? customer.active_constructions
                                    : customer.active_constructions.slice(0, 3);

                                return (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">
                                            <Link
                                                to={`/customers/${customer.id}/constructions`}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                            >
                                                {customer.work_order}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/customers/${customer.id}/constructions`}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                            >
                                                {customer.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.active_constructions.length > 0 ? (
                                                <div className="space-y-1">
                                                    {displayedConstructions.map((ac) => (
                                                        <Link
                                                            key={ac.id}
                                                            to={`/constructions/${ac.id}/reports`}
                                                            className="block truncate max-w-md text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline text-sm"
                                                        >
                                                            {ac.work_order}, {ac.name}
                                                        </Link>
                                                    ))}
                                                    {hasMany && (
                                                        <button
                                                            onClick={() => toggleRow(customer.id)}
                                                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mt-1"
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    <ChevronUp className="h-3 w-3" />
                                                                    {t('dashboard.showLess')}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown className="h-3 w-3" />
                                                                    {t('dashboard.showMore')} {customer.active_constructions.length - 3}
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">{t('dashboard.none')}</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
