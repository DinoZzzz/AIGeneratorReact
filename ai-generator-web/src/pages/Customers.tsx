import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { Plus, Search, Pencil, Trash2, Building2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Customer } from '../types';
import { useLanguage } from '../context/LanguageContext';

type SortField = 'work_order' | 'name' | 'location' | 'address';
type SortOrder = 'asc' | 'desc';

export const Customers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const { t } = useLanguage();

    // Pagination & Sorting state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [sortBy, setSortBy] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        loadCustomers();
    }, [currentPage, pageSize, sortBy, sortOrder, debouncedSearch]);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const { data, count } = await customerService.getCustomers(
                currentPage,
                pageSize,
                sortBy,
                sortOrder,
                debouncedSearch
            );
            setCustomers(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Failed to load customers', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t('customers.deleteConfirm'))) {
            try {
                await customerService.delete(id);
                // Reload to update list and counts
                loadCustomers();
            } catch (error) {
                console.error('Failed to delete customer', error);
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
                    <div className="relative rounded-md shadow-sm max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            className="focus:ring-2 focus:ring-ring focus:border-input block w-full pl-10 sm:text-sm border-input bg-background text-foreground placeholder-muted-foreground rounded-md"
                            placeholder={t('customers.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <TableHeader field="work_order" label={t('customers.workOrder')} />
                                <TableHeader field="name" label={t('customers.name')} />
                                <TableHeader field="location" label={t('customers.location')} />
                                <TableHeader field="address" label={t('customers.address')} />
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('customers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                        {t('customers.loading')}
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
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                                    currentPage === pageNum
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
