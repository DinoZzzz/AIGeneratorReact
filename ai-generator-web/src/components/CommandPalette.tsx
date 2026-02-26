import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Building2, FileText, X, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDebounce } from '../hooks/useDebounce';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import type { RecentItem } from '../hooks/useRecentlyViewed';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { getAllFromStore, STORES } from '../lib/offlineDb';
import { cn } from '../lib/utils';
import type { Customer, Construction, ReportForm } from '../types';

interface SearchResult {
    id: string;
    type: 'customer' | 'construction' | 'report';
    name: string;
    subtext?: string;
    path: string;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

type GroupedResults = {
    customers: SearchResult[];
    constructions: SearchResult[];
    reports: SearchResult[];
};

function groupResults(results: SearchResult[]): GroupedResults {
    return {
        customers: results.filter(r => r.type === 'customer'),
        constructions: results.filter(r => r.type === 'construction'),
        reports: results.filter(r => r.type === 'report'),
    };
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { isOnline } = useOffline();
    const { items: recentItems } = useRecentlyViewed();

    const debouncedQuery = useDebounce(query, 200);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [isOpen]);

    // Search when query changes
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            return;
        }

        let cancelled = false;

        const searchOnline = async () => {
            const searchTerm = `%${debouncedQuery}%`;
            const searchResults: SearchResult[] = [];

            const [
                { data: customers },
                { data: constructions },
                { data: reports }
            ] = await Promise.all([
                supabase
                    .from('customers')
                    .select('id, name, work_order')
                    .or(`name.ilike.${searchTerm},work_order.ilike.${searchTerm}`)
                    .limit(5),
                supabase
                    .from('constructions')
                    .select('id, name, work_order, customer_id')
                    .or(`name.ilike.${searchTerm},work_order.ilike.${searchTerm}`)
                    .limit(5),
                supabase
                    .from('report_forms')
                    .select('id, dionica, type_id, customer_id, construction_id, section_name')
                    .is('section_name', null)
                    .ilike('dionica', searchTerm)
                    .limit(5),
            ]);

            if (customers) {
                searchResults.push(...customers.map(c => ({
                    id: c.id,
                    type: 'customer' as const,
                    name: c.name,
                    subtext: c.work_order || undefined,
                    path: `/customers/${c.id}/constructions`
                })));
            }

            if (constructions) {
                searchResults.push(...constructions.map(c => ({
                    id: c.id,
                    type: 'construction' as const,
                    name: c.name,
                    subtext: c.work_order || undefined,
                    path: `/customers/${c.customer_id}/constructions/${c.id}/reports`
                })));
            }

            if (reports) {
                searchResults.push(...reports.map(r => ({
                        id: r.id,
                        type: 'report' as const,
                        name: r.dionica || `Report ${r.id.slice(0, 8)}`,
                        subtext: r.type_id === 1 ? 'Water' : 'Air',
                        path: `/customers/${r.customer_id}/constructions/${r.construction_id}/reports/${r.type_id === 1 ? '' : 'air/'}${r.id}`
                    })));
            }

            return searchResults;
        };

        const searchOffline = async () => {
            const lowerQuery = debouncedQuery.toLowerCase();
            const searchResults: SearchResult[] = [];

            const [customers, constructions, reports] = await Promise.all([
                getAllFromStore<Customer>(STORES.CUSTOMERS),
                getAllFromStore<Construction>(STORES.CONSTRUCTIONS),
                getAllFromStore<ReportForm>(STORES.REPORTS),
            ]);

            const matchedCustomers = customers
                .filter(c => c.name?.toLowerCase().includes(lowerQuery) || c.work_order?.toLowerCase().includes(lowerQuery))
                .slice(0, 5);

            searchResults.push(...matchedCustomers.map(c => ({
                id: c.id,
                type: 'customer' as const,
                name: c.name,
                subtext: c.work_order || undefined,
                path: `/customers/${c.id}/constructions`
            })));

            const matchedConstructions = constructions
                .filter(c => c.name?.toLowerCase().includes(lowerQuery) || c.work_order?.toLowerCase().includes(lowerQuery))
                .slice(0, 5);

            searchResults.push(...matchedConstructions.map(c => ({
                id: c.id,
                type: 'construction' as const,
                name: c.name,
                subtext: c.work_order || undefined,
                path: `/customers/${c.customer_id}/constructions/${c.id}/reports`
            })));

            const matchedReports = reports
                .filter(r => !r.section_name && r.dionica?.toLowerCase().includes(lowerQuery))
                .slice(0, 5);

            searchResults.push(...matchedReports.map(r => ({
                id: r.id,
                type: 'report' as const,
                name: r.dionica || `Report ${r.id.slice(0, 8)}`,
                subtext: r.type_id === 1 ? 'Water' : 'Air',
                path: `/customers/${r.customer_id}/constructions/${r.construction_id}/reports/${r.type_id === 1 ? '' : 'air/'}${r.id}`
            })));

            return searchResults;
        };

        const doSearch = async () => {
            setLoading(true);
            try {
                const searchResults = isOnline ? await searchOnline() : await searchOffline();
                if (!cancelled) {
                    setResults(searchResults);
                    setSelectedIndex(0);
                }
            } catch (error) {
                console.error('Search error:', error);
                // Fallback to offline search on error
                try {
                    const offlineResults = await searchOffline();
                    if (!cancelled) {
                        setResults(offlineResults);
                        setSelectedIndex(0);
                    }
                } catch {
                    // Give up
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        doSearch();
        return () => { cancelled = true; };
    }, [debouncedQuery, isOnline]);

    const handleSelect = useCallback((result: SearchResult | RecentItem) => {
        navigate(result.path);
        onClose();
    }, [navigate, onClose]);

    const flatItems = query ? results : recentItems;

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = flatItems[selectedIndex];
            if (item) {
                handleSelect(item);
            }
        }
    }, [flatItems, selectedIndex, handleSelect]);

    if (!isOpen) return null;

    const showRecent = !query && recentItems.length > 0;
    const grouped = query ? groupResults(results) : null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'customer':
                return <Users className="h-4 w-4" />;
            case 'construction':
                return <Building2 className="h-4 w-4" />;
            case 'report':
                return <FileText className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getIconStyles = (type: string) => {
        switch (type) {
            case 'customer':
                return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
            case 'construction':
                return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
            case 'report':
                return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    // Track flat index for keyboard navigation across groups
    let flatIndex = -1;

    const renderItem = (item: SearchResult | RecentItem) => {
        flatIndex++;
        const currentIndex = flatIndex;
        return (
            <button
                key={`${item.type}-${item.id}`}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    currentIndex === selectedIndex
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                )}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(currentIndex)}
            >
                <span className={cn("flex-shrink-0 p-1.5 rounded-md", getIconStyles(item.type))}>
                    {getIcon(item.type)}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                    </p>
                    {item.subtext && (
                        <p className="text-xs text-muted-foreground truncate">
                            {item.subtext}
                        </p>
                    )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
        );
    };

    const renderGrouped = () => {
        if (!grouped) return null;
        flatIndex = -1;

        const sections: { key: string; label: string; items: SearchResult[] }[] = [
            { key: 'customers', label: t('commandPalette.customers'), items: grouped.customers },
            { key: 'constructions', label: t('commandPalette.constructions'), items: grouped.constructions },
            { key: 'reports', label: t('commandPalette.reports'), items: grouped.reports },
        ];

        return sections.map(section => {
            if (section.items.length === 0) return null;
            return (
                <div key={section.key}>
                    <div className="px-4 py-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {section.label}
                        </span>
                    </div>
                    {section.items.map(item => renderItem(item))}
                </div>
            );
        });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
                <div className="relative w-full max-w-lg transform rounded-xl bg-card shadow-2xl ring-1 ring-border transition-all">
                    {/* Search input */}
                    <div className="flex items-center border-b border-border px-4">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="h-14 w-full border-0 bg-transparent pl-3 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                            placeholder={t('commandPalette.searchPlaceholder') || 'Search customers, constructions, reports...'}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md hover:bg-muted transition-colors"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto py-2">
                        {loading && (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                {t('commandPalette.searching') || 'Searching...'}
                            </div>
                        )}

                        {!loading && query && results.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                {t('commandPalette.noResults') || 'No results found'}
                            </div>
                        )}

                        {!loading && showRecent && (
                            <>
                                <div className="px-3 py-2">
                                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                                        <Clock className="h-3 w-3" />
                                        {t('commandPalette.recent') || 'Recently Viewed'}
                                    </div>
                                </div>
                                {(() => { flatIndex = -1; return null; })()}
                                {recentItems.map(item => renderItem(item))}
                            </>
                        )}

                        {!loading && query && results.length > 0 && renderGrouped()}

                        {!loading && !query && recentItems.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                {t('commandPalette.typeToSearch') || 'Type to search...'}
                            </div>
                        )}
                    </div>

                    {/* Footer with keyboard hints */}
                    <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↑↓</kbd>
                                {t('commandPalette.navigate') || 'Navigate'}
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↵</kbd>
                                {t('commandPalette.select') || 'Select'}
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Esc</kbd>
                                {t('commandPalette.close') || 'Close'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
