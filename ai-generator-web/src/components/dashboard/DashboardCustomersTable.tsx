
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CustomerTableItem {
    id: string;
    work_order: string;
    name: string;
    active_constructions: string[]; // List of work_order + name strings
}

export const DashboardCustomersTable = () => {
    const [customers, setCustomers] = useState<CustomerTableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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
                    constructions (
                        work_order,
                        name,
                        is_active
                    )
                `);

            if (search) {
                // Adjusted search to only search name since work_order might not exist on customer
                query = query.ilike('name', `%${search}%`);
            }

            query = query.range(0, 49);

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                const formatted: CustomerTableItem[] = data.map((c: any) => {
                    const active = c.constructions
                        ?.filter((con: any) => con.is_active)
                        .map((con: any) => `${con.work_order || ''}, ${con.name}`)
                        .slice(0, 3); // Take top 3

                    return {
                        id: c.id,
                        work_order: '-', // Default since column is missing or we aren't selecting it
                        name: c.name,
                        active_constructions: active || []
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

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Naručitelji</h2>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search..."
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
                        Dodaj naručitelja
                    </Link>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Broj</th>
                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Naručitelj</th>
                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Aktivni Radni Nalozi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No customers found</td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium">{customer.work_order}</td>
                                    <td className="px-6 py-4">{customer.name}</td>
                                    <td className="px-6 py-4">
                                        {customer.active_constructions.length > 0 ? (
                                            <div className="space-y-1">
                                                {customer.active_constructions.map((ac, i) => (
                                                    <div key={i} className="truncate max-w-md text-gray-600 dark:text-gray-300">{ac}</div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">None</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
