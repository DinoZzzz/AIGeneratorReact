import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Building2, FileText, X, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDebounce } from '../hooks/useDebounce';
import { useRecentlyViewed, RecentItem } from '../hooks/useRecentlyViewed';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

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

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { t } = useLanguage();
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

        const search = async () => {
            setLoading(true);
            try {
                const searchTerm = `%${debouncedQuery}%`;
                const searchResults: SearchResult[] = [];

                // Search customers
                const { data: customers } = await supabase
                    .from('customers')
                    .select('id, name, work_order')
                    .or(`name.ilike.${searchTerm},work_order.ilike.${searchTerm}`)
                    .limit(5);

                if (customers) {
                    searchResults.push(...customers.map(c => ({
                        id: c.id,
                        type: 'customer' as const,
                        name: c.name,
                        subtext: c.work_order || undefined,
                        path: `/customers/${c.id}/constructions`
                    })));
                }

                // Search constructions
                const { data: constructions } = await supabase
                    .from('constructions')
                    .select('id, name, work_order, customer_id')
                    .or(`name.ilike.${searchTerm},work_order.ilike.${searchTerm}`)
                    .limit(5);

                if (constructions) {
                    searchResults.push(...constructions.map(c => ({
                        id: c.id,
                        type: 'construction' as const,
                        name: c.name,
                        subtext: c.work_order || undefined,
                        path: `/customers/${c.customer_id}/constructions/${c.id}/reports`
                    })));
                }

                setResults(searchResults);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [debouncedQuery]);

    const handleSelect = useCallback((result: SearchResult | RecentItem) => {
        navigate(result.path);
        onClose();
    }, [navigate, onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const items = query ? results : recentItems;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, items.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = items[selectedIndex];
            if (item) {
                handleSelect(item);
            }
        }
    }, [query, results, recentItems, selectedIndex, handleSelect]);

    if (!isOpen) return null;

    const displayItems = query ? results : recentItems;
    const showRecent = !query && recentItems.length > 0;

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
                            placeholder={t('commandPalette.searchPlaceholder') || 'Search customers, constructions...'}
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
                            <div className="px-3 py-2">
                                <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                                    <Clock className="h-3 w-3" />
                                    {t('commandPalette.recent') || 'Recently Viewed'}
                                </div>
                            </div>
                        )}

                        {!loading && displayItems.map((item, index) => (
                            <button
                                key={`${item.type}-${item.id}`}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                    index === selectedIndex
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted"
                                )}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <span className={cn(
                                    "flex-shrink-0 p-1.5 rounded-md",
                                    item.type === 'customer' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                                    item.type === 'construction' && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                                    item.type === 'report' && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                )}>
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
                        ))}

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
