import { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { useDebounce } from '../../hooks/useDebounce';

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

interface CustomerWithConstructions {
    id: string;
    work_order: string;
    name: string;
    updated_at: string;
    created_at: string;
    constructions: {
        id: string;
        work_order: string | null;
        name: string;
        is_active: boolean;
        updated_at: string;
        created_at: string;
    }[] | null;
}

// Helper to get the most recent activity date per customer from multiple tables
// Optimized to run all table queries in parallel and only keep MAX date per customer
async function getLatestActivityDates(
    customerIds: string[]
): Promise<Map<string, string>> {
    if (customerIds.length === 0) return new Map();

    const result = new Map<string, string>();
    const batchSize = 50;
    const batches: string[][] = [];

    for (let i = 0; i < customerIds.length; i += batchSize) {
        batches.push(customerIds.slice(i, i + batchSize));
    }

    // Query all three tables in parallel for all batches
    const allQueries = batches.flatMap(batch => [
        supabase.from('report_forms').select('customer_id, updated_at').in('customer_id', batch),
        supabase.from('report_exports').select('customer_id, updated_at').in('customer_id', batch),
        supabase.from('appointments').select('customer_id, created_at').in('customer_id', batch)
    ]);

    const results = await Promise.all(allQueries);

    // Process all results and keep only the latest date per customer
    for (const { data } of results) {
        if (data) {
            for (const row of data as { customer_id: string; updated_at?: string; created_at?: string }[]) {
                const customerId = row.customer_id;
                const date = row.updated_at || row.created_at;
                if (date) {
                    const existing = result.get(customerId);
                    if (!existing || new Date(date) > new Date(existing)) {
                        result.set(customerId, date);
                    }
                }
            }
        }
    }

    return result;
}

// Memoized table row component to prevent unnecessary re-renders
const CustomerTableRow = memo(({ customer, t }: { customer: CustomerTableItem; t: (key: string) => string }) => {
    const displayedConstructions = customer.active_constructions.slice(0, 5);
    const remainingCount = customer.active_constructions.length - 5;

    return (
        <tr className="hover:bg-muted/50 transition-colors">
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
});
CustomerTableRow.displayName = 'CustomerTableRow';

// Memoized mobile card component
const CustomerMobileCard = memo(({ customer, t }: { customer: CustomerTableItem; t: (key: string) => string }) => {
    const displayedConstructions = customer.active_constructions.slice(0, 3);
    const remainingCount = customer.active_constructions.length - 3;

    return (
        <div className="p-4 space-y-3">
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
});
CustomerMobileCard.displayName = 'CustomerMobileCard';

const DashboardCustomersTableComponent = () => {
    const [customers, setCustomers] = useState<CustomerTableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const { t } = useLanguage();

    // Debounce search to reduce API calls while typing
    const debouncedSearch = useDebounce(search, 300);

    const ITEMS_PER_PAGE = 8;

    useEffect(() => {
        fetchCustomers();
        // fetchCustomers is stable - only depends on debouncedSearch and currentPage
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, currentPage]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // Fetch all customers with their relations to calculate activity
            let customerQuery = supabase
                .from('customers')
                .select(`
                    id,
                    name,
                    work_order,
                    updated_at,
                    created_at,
                    constructions (
                        id,
                        work_order,
                        name,
                        is_active,
                        updated_at,
                        created_at
                    )
                `);

            if (debouncedSearch) {
                const searchFilter = `name.ilike.%${debouncedSearch}%,work_order.ilike.%${debouncedSearch}%`;
                customerQuery = customerQuery.or(searchFilter);
            }

            const { data: customersData, error: customersError } = await customerQuery;

            if (customersError) throw customersError;

            if (!customersData || customersData.length === 0) {
                setCustomers([]);
                setTotalCount(0);
                return;
            }

            const customerIds = (customersData as CustomerWithConstructions[]).map((c) => c.id);

            // Get latest activity dates from all related tables in a single optimized call
            const activityDates = await getLatestActivityDates(customerIds);

            // Format customers with activity calculation
            const formatted: (CustomerTableItem & { last_activity_date: string })[] = (customersData as CustomerWithConstructions[]).map((c) => {
                const active = c.constructions
                    ?.filter((con) => con.is_active)
                    .map((con) => ({
                        id: con.id,
                        work_order: con.work_order || '',
                        name: con.name,
                        updated_at: con.updated_at,
                        created_at: con.created_at
                    }))
                    .sort((a, b) => {
                        const dateA = new Date(a.updated_at || a.created_at).getTime();
                        const dateB = new Date(b.updated_at || b.created_at).getTime();
                        return dateB - dateA;
                    }) || [];

                // Calculate last activity date from customer, constructions, and related activities
                const dates = [
                    c.updated_at,
                    ...(c.constructions?.map((con) => con.updated_at) || []),
                    activityDates.get(c.id) // Latest activity from reports, exports, appointments
                ].filter(Boolean);

                const lastActivityDate = dates.length > 0
                    ? new Date(Math.max(...dates.map(d => new Date(d as string).getTime())))
                    : new Date(c.created_at);

                return {
                    id: c.id,
                    work_order: c.work_order || '-',
                    name: c.name,
                    active_constructions: active,
                    last_activity_date: lastActivityDate.toISOString()
                };
            });

            // Sort by last activity (most recent first)
            formatted.sort((a, b) => {
                const dateA = new Date(a.last_activity_date).getTime();
                const dateB = new Date(b.last_activity_date).getTime();
                return dateB - dateA;
            });

            // Apply pagination
            setTotalCount(formatted.length);
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            const paginatedData = formatted.slice(start, end);

            setCustomers(paginatedData);

        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

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
                    customers.map((customer) => (
                        <CustomerMobileCard key={customer.id} customer={customer} t={t} />
                    ))
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
                            customers.map((customer) => (
                                <CustomerTableRow key={customer.id} customer={customer} t={t} />
                            ))
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

// Memoize to prevent unnecessary re-renders when parent updates
export const DashboardCustomersTable = memo(DashboardCustomersTableComponent);
DashboardCustomersTable.displayName = 'DashboardCustomersTable';
