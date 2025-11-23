import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyService } from '../services/historyService';
import type { ReportExport } from '../types';
import { Loader2, Search, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const History = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [exports, setExports] = useState<ReportExport[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState<number | null>(0);
    const pageSize = 50;
    const [sortColumn, setSortColumn] = useState<'created_at' | 'construction_part'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await historyService.getAll(page, pageSize, debouncedSearch, sortColumn, sortOrder);
            setExports(result.data);
            setTotalCount(result.count);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, sortColumn, sortOrder]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this report export?')) return;
        try {
            await historyService.delete(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete export:', error);
            alert('Failed to delete export.');
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleSort = (column: 'created_at' | 'construction_part') => {
        if (sortColumn === column) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortOrder('asc');
        }
    };

    const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;

    const formatName = (p?: { name?: string; last_name?: string; email?: string }) => {
        if (!p) return '-';
        const full = [p.name, p.last_name].filter(Boolean).join(' ').trim();
        return full || p.email || '-';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-foreground">{t('history.title')}</h1>
            </div>

            <div className="bg-card shadow rounded-lg border border-border">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('history.searchPlaceholder')}
                            className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input sm:text-sm"
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">
                            {t('history.page')} {page + 1} {t('history.of')} {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="p-2 rounded-md hover:bg-accent text-foreground disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages - 1 || loading}
                            className="p-2 rounded-md hover:bg-accent text-foreground disabled:opacity-50 transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('history.certifier')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('history.createdBy')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('construction_part')}
                                >
                                    {t('history.constructionPart')} {sortColumn === 'construction_part' && (sortOrder === 'asc' ? '▲' : '▼')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('history.formsCount')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort('created_at')}
                                >
                                    {t('history.creationTime')} {sortColumn === 'created_at' && (sortOrder === 'asc' ? '▲' : '▼')}
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.action')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" /> {t('history.loading')}
                                    </td>
                                </tr>
                            ) : exports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <p className="text-lg font-medium text-foreground">{t('history.noDataTitle')}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {t('history.noDataDesc')}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                exports.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            {item.certifier_name || formatName(item.certifier)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            {formatName(item.user)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            <button
                                                onClick={() => item.construction_id && item.customer_id && navigate(`/customers/${item.customer_id}/constructions/${item.construction_id}/reports`)}
                                                className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                                            >
                                                {item.construction_part}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            {item.forms_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/history/${item.id}`)}
                                                className="text-primary hover:text-primary/80 mr-4 inline-flex items-center transition-colors"
                                                title={t('history.open')}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" /> {t('history.open')}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-destructive hover:text-destructive/80 inline-flex items-center transition-colors"
                                                title={t('history.remove')}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" /> {t('history.remove')}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
