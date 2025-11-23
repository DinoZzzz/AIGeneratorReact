import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

interface ActiveConstruction {
    id: string;
    work_order: string;
    name: string;
    updated_at?: string;
    created_at: string;
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
    const { t } = useLanguage();

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
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
                        is_active,
                        updated_at,
                        created_at
                    )
                `);

            if (search) {
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
                            name: con.name,
                            updated_at: con.updated_at,
                            created_at: con.created_at
                        }))
                        .sort((a: any, b: any) => {
                            const dateA = new Date(a.updated_at || a.created_at).getTime();
                            const dateB = new Date(b.updated_at || b.created_at).getTime();
                            return dateB - dateA;
                        }) || [];

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

    return (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">{t('dashboard.customersTable')}</h2>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('dashboard.search')}
                            className="pl-9 pr-4 py-2 bg-muted border-none rounded-md text-sm w-full sm:w-64 focus:ring-2 focus:ring-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Link
                        to="/customers/new"
                        className="flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('dashboard.addCustomer')}
                    </Link>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-6 py-3 font-medium text-muted-foreground">{t('dashboard.workOrder')}</th>
                            <th className="px-6 py-3 font-medium text-muted-foreground">{t('dashboard.customer')}</th>
                            <th className="px-6 py-3 font-medium text-muted-foreground">{t('dashboard.activeOrders')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">{t('dashboard.loading')}</td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">{t('dashboard.noCustomers')}</td>
                            </tr>
                        ) : (
                            customers.map((customer) => {
                                const displayedConstructions = customer.active_constructions.slice(0, 5);
                                const remainingCount = customer.active_constructions.length - 5;

                                return (
                                    <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">
                                            <Link
                                                to={`/customers/${customer.id}/constructions`}
                                                className="text-primary hover:underline"
                                            >
                                                {customer.work_order}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/customers/${customer.id}/constructions`}
                                                className="text-primary hover:underline"
                                            >
                                                {customer.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.active_constructions.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {displayedConstructions.map((ac) => (
                                                        <Link
                                                            key={ac.id}
                                                            to={`/customers/${customer.id}/constructions/${ac.id}/reports`}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                        >
                                                            {ac.work_order}
                                                        </Link>
                                                    ))}
                                                    {remainingCount > 0 && (
                                                        <Link
                                                            to={`/customers/${customer.id}/constructions`}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                                                        >
                                                            +{remainingCount}
                                                        </Link>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic text-sm">{t('dashboard.none')}</span>
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
