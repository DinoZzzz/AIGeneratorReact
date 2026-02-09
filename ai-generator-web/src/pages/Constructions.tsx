import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, FileText, MapPin, HardHat, Archive, ArchiveRestore } from 'lucide-react';
import type { Construction } from '../types';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useCustomer } from '../hooks/useCustomers';
import {
    useConstructionsByCustomer,
    useDeleteConstruction,
    useUpdateConstruction,
} from '../hooks/useConstructions';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/dateFormatter';
import { useConfirm } from '../context/useConfirm';
import { useHandleError } from '../hooks/useHandleError';

type FilterType = 'all' | 'active' | 'archived';

export const Constructions = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const handleError = useHandleError();
    const confirm = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const { t } = useLanguage();
    const { profile } = useAuth();
    const { addItem: addRecentItem } = useRecentlyViewed();

    // Archive state
    const [filter, setFilter] = useState<FilterType>(() => {
        // Admins see all by default, regular users see only active
        return profile?.role === 'admin' ? 'all' : 'active';
    });
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [selectedConstruction, setSelectedConstruction] = useState<Construction | null>(null);
    const [isArchiving, setIsArchiving] = useState(true);
    const [archiveLoading, setArchiveLoading] = useState(false);

    const isAdmin = profile?.role === 'admin';
    const normalizedCustomerId = customerId || '';
    const includeArchived = isAdmin;
    const { data: customer, isLoading: isCustomerLoading, error: customerError } = useCustomer(normalizedCustomerId);
    const {
        data: constructions = [],
        isLoading: isConstructionsLoading,
        error: constructionsError
    } = useConstructionsByCustomer(normalizedCustomerId, includeArchived);
    const deleteConstruction = useDeleteConstruction();
    const updateConstruction = useUpdateConstruction();

    const ITEMS_PER_PAGE = 15;

    useEffect(() => {
        if (customerError) {
            handleError(customerError, 'Constructions');
        }
    }, [customerError, handleError]);

    useEffect(() => {
        if (constructionsError) {
            handleError(constructionsError, 'Constructions');
        }
    }, [constructionsError, handleError]);

    // Track customer in recently viewed
    useEffect(() => {
        if (customer && customerId) {
            addRecentItem({
                id: customerId,
                type: 'customer',
                name: customer.name,
                subtext: customer.work_order || undefined,
                path: `/customers/${customerId}/constructions`
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customer?.id]);

    const handleArchiveClick = useCallback((construction: Construction) => {
        setSelectedConstruction(construction);
        setIsArchiving(!construction.is_archived);
        setArchiveDialogOpen(true);
    }, []);

    const handleArchiveConfirm = useCallback(async () => {
        if (!selectedConstruction) return;

        setArchiveLoading(true);
        try {
            await updateConstruction.mutateAsync({
                id: selectedConstruction.id,
                construction: { is_archived: isArchiving }
            });
            setArchiveDialogOpen(false);
        } catch (error) {
            handleError(error, 'Constructions');
        } finally {
            setArchiveLoading(false);
        }
    }, [selectedConstruction, isArchiving, updateConstruction, handleError]);

    const handleDelete = useCallback(async (id: string) => {
        if (await confirm({ title: t('constructions.deleteConfirm'), variant: 'destructive' })) {
            try {
                await deleteConstruction.mutateAsync(id);
            } catch (error) {
                handleError(error, 'Constructions');
            }
        }
    }, [confirm, t, deleteConstruction, handleError]);

    // Memoize filtered constructions to prevent recalculation on every render
    const filteredConstructions = useMemo(() => {
        return constructions
            .filter(c => {
                if (filter === 'active') return !c.is_archived;
                if (filter === 'archived') return c.is_archived;
                return true; // 'all'
            })
            .filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.work_order?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.location?.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [constructions, filter, searchTerm]);

    // Pagination
    const totalCount = filteredConstructions.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedConstructions = filteredConstructions.slice(startIndex, endIndex);

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filter]);

    const loading = isCustomerLoading || isConstructionsLoading;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!customer) {
        return <div>Customer not found</div>;
    }

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[
                { label: t('customers.title'), path: '/customers' },
                { label: customer.name, path: '/customers' },
                { label: t('constructions.title') }
            ]} />

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/customers')}
                        className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Go back to customers"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t('constructions.title')}</h1>
                        <p className="text-sm text-muted-foreground">{t('constructions.for')} {customer.name}</p>
                    </div>
                </div>
                <Link
                    to={`/customers/${customerId}/constructions/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    {t('constructions.new')}
                </Link>
            </div>

            <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                <div className="p-4 border-b border-border">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            placeholder={t('constructions.search')}
                            className="flex-1 px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {isAdmin && (
                            <div className="inline-flex rounded-lg border border-input p-1 bg-muted/30">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {t('constructions.filterAll')}
                                </button>
                                <button
                                    onClick={() => setFilter('active')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'active'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {t('constructions.filterActive')}
                                </button>
                                <button
                                    onClick={() => setFilter('archived')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'archived'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {t('constructions.filterArchived')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-border">
                    {paginatedConstructions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center">
                                <HardHat className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-lg font-medium text-foreground">{t('constructions.none')}</p>
                                <p className="text-sm text-muted-foreground mt-1">{t('constructions.noneDesc')}</p>
                            </div>
                        </div>
                    ) : (
                        paginatedConstructions.map((construction) => (
                            <div key={construction.id} className={`p-4 space-y-3 ${construction.is_archived ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                {construction.work_order || '-'}
                                            </span>
                                            {construction.is_archived && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                                    <Archive className="h-3 w-3 mr-1" />
                                                    {t('constructions.archivedBadge')}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground flex items-center">
                                            <HardHat className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                                            <span className="truncate max-w-[200px] md:max-w-[300px]" title={construction.name}>{construction.name}</span>
                                        </h3>
                                    </div>
                                    <div className="flex space-x-2">
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleArchiveClick(construction)}
                                                className={`p-2 rounded-full transition-colors ${construction.is_archived ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30' : 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'}`}
                                                title={construction.is_archived ? t('constructions.unarchive') : t('constructions.archive')}
                                            >
                                                {construction.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                                            </button>
                                        )}
                                        <Link
                                            to={`/customers/${customerId}/constructions/${construction.id}`}
                                            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(construction.id)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {construction.location && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        {construction.location}
                                    </div>
                                )}
                                <div className="flex items-center text-xs pt-1">
                                    <span className="text-muted-foreground">
                                        {formatDate(construction.created_at)}
                                    </span>
                                </div>

                                {!construction.is_archived && (
                                    <Link
                                        to={`/customers/${customerId}/constructions/${construction.id}/reports`}
                                        className="block w-full text-center py-2 px-4 border border-border rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors"
                                    >
                                        <FileText className="h-4 w-4 inline-block mr-2 text-green-600" />
                                        {t('constructions.viewReports')}
                                    </Link>
                                )}
                                {construction.is_archived && (
                                    <div className="block w-full text-center py-2 px-4 border border-border rounded-md text-sm font-medium text-muted-foreground bg-muted/50 cursor-not-allowed">
                                        <FileText className="h-4 w-4 inline-block mr-2 opacity-50" />
                                        {t('constructions.viewReports')}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('constructions.workOrder')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('constructions.name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('constructions.location')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('constructions.dateAdded')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('constructions.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {paginatedConstructions.map((construction) => (
                                <tr key={construction.id} className={`hover:bg-muted/50 transition-colors ${construction.is_archived ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                        <div className="flex items-center gap-2">
                                            {construction.work_order}
                                            {construction.is_archived && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                                    <Archive className="h-3 w-3 mr-1" />
                                                    {t('constructions.archivedBadge')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[250px]">
                                        <span className="block truncate" title={construction.name}>{construction.name}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {construction.location}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {formatDate(construction.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        {!construction.is_archived ? (
                                            <Link
                                                to={`/customers/${customerId}/constructions/${construction.id}/reports`}
                                                className="text-green-600 hover:text-green-700 inline-flex items-center action-link"
                                                title={t('constructions.viewReports')}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground/50 inline-flex items-center cursor-not-allowed" aria-disabled="true" title={t('constructions.archived')}>
                                                <FileText className="h-4 w-4" />
                                            </span>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleArchiveClick(construction)}
                                                className={`inline-flex items-center action-link ${construction.is_archived ? 'text-green-600 hover:text-green-700' : 'text-amber-600 hover:text-amber-700'}`}
                                                title={construction.is_archived ? t('constructions.unarchive') : t('constructions.archive')}
                                            >
                                                {construction.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                                            </button>
                                        )}
                                        <Link
                                            to={`/customers/${customerId}/constructions/${construction.id}`}
                                            className="text-primary hover:text-primary/80 inline-flex items-center action-link"
                                            title={t('constructions.edit')}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(construction.id)}
                                            className="text-destructive hover:text-destructive/80 inline-flex items-center action-link"
                                            title={t('constructions.delete')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedConstructions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <HardHat className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <p className="text-lg font-medium text-foreground">{t('constructions.none')}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{t('constructions.noneDesc')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && totalCount > 0 && totalPages > 1 && (
                    <div className="px-4 py-3 flex items-center justify-between border-t border-border">
                        <div className="text-sm text-muted-foreground">
                            {t('customers.showing')} {startIndex + 1} {t('customers.to')} {Math.min(endIndex, totalCount)} {t('customers.of')} {totalCount} {t('customers.results')}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
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
                                type="button"
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

            {/* Archive Confirmation Dialog */}
            {selectedConstruction && (
                <ConfirmDialog
                    open={archiveDialogOpen}
                    onConfirm={handleArchiveConfirm}
                    onCancel={() => setArchiveDialogOpen(false)}
                    title={isArchiving ? t('constructions.archiveConfirmTitle') : t('constructions.unarchiveConfirmTitle')}
                    description={isArchiving ? t('constructions.archiveConfirmMessage') : t('constructions.unarchiveConfirmMessage')}
                    confirmLabel={isArchiving ? t('constructions.archive') : t('constructions.unarchive')}
                    cancelLabel={t('common.cancel')}
                    variant="default"
                    icon={isArchiving
                        ? <Archive className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        : <ArchiveRestore className="h-6 w-6 text-green-600 dark:text-green-400" />
                    }
                    confirmClassName={isArchiving ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                    loading={archiveLoading}
                >
                    <div className="bg-muted/50 p-3 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground mb-1">{t('constructions.name')}:</p>
                        <p className="font-semibold text-foreground">{selectedConstruction.name}</p>
                        {selectedConstruction.work_order && (
                            <>
                                <p className="text-xs text-muted-foreground mt-2 mb-1">{t('constructions.workOrder')}:</p>
                                <p className="font-semibold text-foreground">{selectedConstruction.work_order}</p>
                            </>
                        )}
                        {selectedConstruction.location && (
                            <>
                                <p className="text-xs text-muted-foreground mt-2 mb-1">{t('constructions.location')}:</p>
                                <p className="font-semibold text-foreground">{selectedConstruction.location}</p>
                            </>
                        )}
                    </div>
                </ConfirmDialog>
            )}
        </div>
    );
};
