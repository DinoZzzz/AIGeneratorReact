import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Building2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, MapPin, Home, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCustomers, useDeleteCustomer } from '../hooks/useCustomers';
import { TableSkeleton } from '../components/skeletons';
import { errorHandler } from '../lib/errorHandler';
import { useToast } from '../context/ToastContext';


type SortField = 'work_order' | 'name' | 'location' | 'address' | 'created_at' | 'last_activity';
type SortOrder = 'asc' | 'desc';

export const Customers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const { t } = useLanguage();
    const { success, error: showError } = useToast();

    // Pagination & Sorting state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(15);
    const [sortBy, setSortBy] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // React Query hooks
    const { data, isLoading: loading, error } = useCustomers(
        currentPage,
        pageSize,
        sortBy,
        sortOrder,
        debouncedSearch
    );
    const deleteMutation = useDeleteCustomer();

    const customers = data?.data || [];
    const totalCount = data?.count || 0;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
            setCurrentPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle errors
    useEffect(() => {
        if (error) {
            const appError = errorHandler.handle(error, 'Customers', { logToConsole: true });
            showError(errorHandler.getUserMessage(appError));
        }
    }, [error, showError]);

    const handleDelete = async (id: string) => {
        if (window.confirm(t('customers.deleteConfirm'))) {
            try {
                await deleteMutation.mutateAsync(id);
                success(t('customers.deleteSuccess') || 'Customer deleted successfully');
            } catch (err) {
                const appError = errorHandler.handle(err, 'CustomerDelete');
                showError(errorHandler.getUserMessage(appError));
            }
        }
    };

    const handleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
        return sortOrder === 'asc'
            ? <ArrowUp className="h-4 w-4 ml-1 text-primary" />
            : <ArrowDown className="h-4 w-4 ml-1 text-primary" />;
    };

    const TableHeader = ({ field, label }: { field: SortField, label: string }) => (
        <th
            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center">
                {label}
                <SortIcon field={field} />
            </div>
        </th>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-foreground">{t('customers.title')}</h1>
                <Link
                    to="/customers/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    {t('customers.new')}
                </Link>
            </div>

            <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                <div className="p-4 border-b border-border">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <div className="relative rounded-md shadow-sm w-full sm:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-4 py-2 text-sm bg-background border border-input text-foreground placeholder:text-muted-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                                placeholder={t('customers.search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => {
                                if (sortBy === 'last_activity') {
                                    setSortBy('created_at');
                                    setSortOrder('desc');
                                } else {
                                    setSortBy('last_activity');
                                    setSortOrder('desc');
                                }
                            }}
                            className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                                sortBy === 'last_activity'
                                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                                    : 'bg-card text-foreground border-input hover:bg-accent'
                            }`}
                        >
                            <Activity className="h-4 w-4 mr-2" />
                            {t('customers.sortByActivity')}
                        </button>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-border">
                    {loading ? (
                        <div className="p-4">
                            <TableSkeleton rows={3} />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {t('customers.none')}
                        </div>
                    ) : (
                        customers.map((customer) => (
                            <div key={customer.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground mb-1">
                                            {customer.work_order || '-'}
                                        </span>
                                        <h3 className="text-lg font-bold text-foreground">{customer.name}</h3>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Link
                                            to={`/customers/${customer.id}`}
                                            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(customer.id)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 text-sm text-muted-foreground">
                                    {customer.location && (
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-2" />
                                            {customer.location}
                                        </div>
                                    )}
                                    {customer.address && (
                                        <div className="flex items-center">
                                            <Home className="h-4 w-4 mr-2" />
                                            {customer.address}
                                        </div>
                                    )}
                                    <div className="flex items-center text-xs pt-1">
                                        <span className="text-muted-foreground">
                                            {new Date(customer.created_at).toLocaleDateString('hr-HR')}
                                        </span>
                                    </div>
                                </div>

                                <Link
                                    to={`/customers/${customer.id}/constructions`}
                                    className="block w-full text-center py-2 px-4 border border-border rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors"
                                >
                                    <Building2 className="h-4 w-4 inline-block mr-2" />
                                    {t('customers.viewConstructions')}
                                </Link>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <TableHeader field="work_order" label={t('customers.workOrder')} />
                                <TableHeader field="name" label={t('customers.name')} />
                                <TableHeader field="location" label={t('customers.location')} />
                                <TableHeader field="address" label={t('customers.address')} />
                                <TableHeader field="created_at" label={t('customers.dateAdded')} />
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('customers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-4">
                                        <TableSkeleton rows={pageSize} />
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                        {t('customers.none')}
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            {customer.work_order}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                            {customer.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {customer.location}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {customer.address}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {new Date(customer.created_at).toLocaleDateString('hr-HR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <Link
                                                to={`/customers/${customer.id}/constructions`}
                                                className="text-muted-foreground hover:text-foreground inline-flex items-center transition-colors"
                                                title={t('customers.viewConstructions')}
                                            >
                                                <Building2 className="h-4 w-4" />
                                            </Link>
                                            <Link
                                                to={`/customers/${customer.id}`}
                                                className="text-primary hover:text-primary/80 inline-flex items-center transition-colors"
                                                title={t('customers.edit')}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="text-destructive hover:text-destructive/80 inline-flex items-center transition-colors"
                                                title={t('customers.actions')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-card px-4 py-3 border-t border-border sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-accent disabled:opacity-50 transition-colors"
                            >
                                {t('customers.prev')}
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-accent disabled:opacity-50 transition-colors"
                            >
                                {t('customers.next')}
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-foreground">
                                    {t('customers.showing')} <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> {t('customers.to')} <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> {t('customers.of')} <span className="font-medium">{totalCount}</span> {t('customers.results')}
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-input bg-card text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
                                    >
                                        <span className="sr-only">{t('customers.prev')}</span>
                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>

                                    {/* Page Numbers */}
                                    {[...Array(totalPages)].map((_, idx) => {
                                        const pageNum = idx + 1;
                                        if (totalPages > 7 && (pageNum < currentPage - 1 || pageNum > currentPage + 1) && pageNum !== 1 && pageNum !== totalPages) {
                                            if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                                return <span key={pageNum} className="relative inline-flex items-center px-4 py-2 border border-input bg-card text-sm font-medium text-foreground">...</span>;
                                            }
                                            return null;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${currentPage === pageNum
                                                    ? 'z-10 bg-primary/10 border-primary text-primary'
                                                    : 'bg-card border-input text-muted-foreground hover:bg-accent'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-input bg-card text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
                                    >
                                        <span className="sr-only">{t('customers.next')}</span>
                                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
