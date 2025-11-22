import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyService } from '../services/historyService';
import type { ReportExport } from '../types';
import { Loader2, Search, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

export const History = () => {
    const navigate = useNavigate();
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
            setPage(0); // Reset to first page on search change
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">History</h1>
            </div>

            <div className="bg-white shadow rounded-lg">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search construction part..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                            Page {page + 1} of {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages - 1 || loading}
                            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Certifier
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created By
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleSort('construction_part')}
                                >
                                    Construction Part {sortColumn === 'construction_part' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Forms Count
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleSort('created_at')}
                                >
                                    Creation Time {sortColumn === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" /> Loading...
                                    </td>
                                </tr>
                            ) : exports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="h-12 w-12 text-gray-300 mb-4" />
                                            <p className="text-lg font-medium text-gray-900">No history found</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Exported reports and their history will appear here.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                exports.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.certifier?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.user?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.construction_part}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.forms_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/history/${item.id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center"
                                                title="Open"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" /> Open
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                                                title="Remove"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" /> Remove
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
