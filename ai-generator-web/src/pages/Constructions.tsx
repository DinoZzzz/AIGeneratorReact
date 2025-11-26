import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { constructionService } from '../services/constructionService';
import { customerService } from '../services/customerService';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, FileText, MapPin, HardHat, Archive, ArchiveRestore } from 'lucide-react';
import type { Construction, Customer } from '../types';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmArchiveDialog } from '../components/constructions/ConfirmArchiveDialog';

type FilterType = 'all' | 'active' | 'archived';

export const Constructions = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const [constructions, setConstructions] = useState<Construction[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const { t } = useLanguage();
    const { profile } = useAuth();

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

    const ITEMS_PER_PAGE = 15;

    useEffect(() => {
        if (customerId) {
            loadData(customerId);
        }
    }, [customerId]);

    const loadData = async (id: string) => {
        setLoading(true);
        try {
            // Admins can see all (including archived), regular users only active
            const includeArchived = isAdmin;
            const [customerData, constructionsData] = await Promise.all([
                customerService.getById(id),
                constructionService.getByCustomerId(id, includeArchived)
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

    const handleArchiveClick = (construction: Construction) => {
        setSelectedConstruction(construction);
        setIsArchiving(!construction.is_archived);
        setArchiveDialogOpen(true);
    };

    const handleArchiveConfirm = async () => {
        if (!selectedConstruction) return;

        setArchiveLoading(true);
        try {
            if (isArchiving) {
                await constructionService.archive(selectedConstruction.id);
            } else {
                await constructionService.unarchive(selectedConstruction.id);
            }
            setArchiveDialogOpen(false);
            if (customerId) {
                loadData(customerId);
            }
        } catch (error) {
            console.error('Failed to archive/unarchive construction', error);
            alert('Failed to archive/unarchive construction');
        } finally {
            setArchiveLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t('constructions.deleteConfirm'))) {
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

    // First filter by archived status, then by search term
    const filteredConstructions = constructions
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
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                        filter === 'all'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {t('constructions.filterAll')}
                                </button>
                                <button
                                    onClick={() => setFilter('active')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                        filter === 'active'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {t('constructions.filterActive')}
                                </button>
                                <button
                                    onClick={() => setFilter('archived')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                        filter === 'archived'
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
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {t('constructions.none')}
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
                                            <HardHat className="h-4 w-4 mr-2 text-primary" />
                                            {construction.name}
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
                                        {new Date(construction.created_at).toLocaleDateString('hr-HR')}
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
                        <thead className="bg-muted/50">
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {construction.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {construction.location}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {new Date(construction.created_at).toLocaleDateString('hr-HR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        {!construction.is_archived ? (
                                            <Link
                                                to={`/customers/${customerId}/constructions/${construction.id}/reports`}
                                                className="text-green-600 hover:text-green-700 inline-flex items-center"
                                                title={t('constructions.viewReports')}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground/50 inline-flex items-center cursor-not-allowed" title={t('constructions.archived')}>
                                                <FileText className="h-4 w-4" />
                                            </span>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleArchiveClick(construction)}
                                                className={`inline-flex items-center ${construction.is_archived ? 'text-green-600 hover:text-green-700' : 'text-amber-600 hover:text-amber-700'}`}
                                                title={construction.is_archived ? t('constructions.unarchive') : t('constructions.archive')}
                                            >
                                                {construction.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                                            </button>
                                        )}
                                        <Link
                                            to={`/customers/${customerId}/constructions/${construction.id}`}
                                            className="text-primary hover:text-primary/80 inline-flex items-center"
                                            title={t('constructions.edit')}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(construction.id)}
                                            className="text-destructive hover:text-destructive/80 inline-flex items-center"
                                            title={t('constructions.delete')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedConstructions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                        {t('constructions.none')}
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

            {/* Archive Confirmation Dialog */}
            <ConfirmArchiveDialog
                open={archiveDialogOpen}
                onOpenChange={setArchiveDialogOpen}
                onConfirm={handleArchiveConfirm}
                construction={selectedConstruction}
                isArchiving={isArchiving}
                loading={archiveLoading}
            />
        </div>
    );
};
