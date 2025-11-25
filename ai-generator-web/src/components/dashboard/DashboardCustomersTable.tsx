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
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const { t } = useLanguage();

    const ITEMS_PER_PAGE = 8;

    useEffect(() => {
        fetchCustomers();
    }, [search, currentPage]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE - 1;

            let countQuery = supabase
                .from('customers')
                .select('*', { count: 'exact', head: true });

            let dataQuery = supabase
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
                const searchFilter = `name.ilike.%${search}%,work_order.ilike.%${search}%`;
                countQuery = countQuery.or(searchFilter);
                dataQuery = dataQuery.or(searchFilter);
            }

            dataQuery = dataQuery.range(start, end);

            const [{ count }, { data, error }] = await Promise.all([
                countQuery,
                dataQuery
            ]);

            if (error) throw error;

            setTotalCount(count || 0);

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

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

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

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-border">
                {loading ? (
                    <div className="p-4 text-center text-muted-foreground">{t('dashboard.loading')}</div>
                ) : customers.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">{t('dashboard.noCustomers')}</div>
                ) : (
                    customers.map((customer) => {
                        const displayedConstructions = customer.active_constructions.slice(0, 3);
                        const remainingCount = customer.active_constructions.length - 3;

                        return (
                            <div key={customer.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground mb-1">
                                            {customer.work_order}
                                        </span>
                                        <h3 className="font-medium text-foreground">
                                            <Link to={`/customers/${customer.id}/constructions`} className="hover:underline">
                                                {customer.name}
                                            </Link>
                                        </h3>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">
                                        {t('dashboard.activeOrders')}
                                    </span>
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
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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

            {/* Pagination Controls */}
            {!loading && customers.length > 0 && totalPages > 1 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-border">
                    <div className="text-sm text-muted-foreground">
                        {t('customers.showing')} {startItem} {t('customers.to')} {endItem} {t('customers.of')} {totalCount} {t('customers.results')}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('customers.prev')}
                        </button>
                        <span className="px-3 py-1 text-sm">
                            {t('history.page')} {currentPage} {t('history.of')} {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('customers.next')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
