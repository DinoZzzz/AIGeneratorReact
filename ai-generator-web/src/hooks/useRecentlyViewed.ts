import { useState, useEffect, useCallback } from 'react';

export interface RecentItem {
    id: string;
    type: 'customer' | 'construction' | 'report';
    name: string;
    subtext?: string;
    path: string;
    viewedAt: number;
}

const STORAGE_KEY = 'recently-viewed';
const CHANGE_EVENT = 'recently-viewed-changed';
const MAX_ITEMS = 5;

function getStoredItems(): RecentItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to parse recently viewed items', e);
    }
    return [];
}

function saveItems(items: RecentItem[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch (e) {
        console.error('Failed to save recently viewed items', e);
    }
}

export function useRecentlyViewed() {
    const [items, setItems] = useState<RecentItem[]>(getStoredItems);

    // Sync with localStorage on mount and when other tabs update
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                setItems(getStoredItems());
            }
        };
        window.addEventListener('storage', handleStorage);
        const refresh = () => setItems(getStoredItems());
        window.addEventListener(CHANGE_EVENT, refresh);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(CHANGE_EVENT, refresh);
        };
    }, []);

    const addItem = useCallback((item: Omit<RecentItem, 'viewedAt'>) => {
        const prev = getStoredItems();
        // Remove existing item with same id and type
        const filtered = prev.filter(
            i => !(i.id === item.id && i.type === item.type)
        );

        // Add new item at the beginning
        const newItems = [
            { ...item, viewedAt: Date.now() },
            ...filtered
        ].slice(0, MAX_ITEMS);

        saveItems(newItems);
    }, []);

    const removeItem = useCallback((id: string, type: RecentItem['type']) => {
        const prev = getStoredItems();
        const newItems = prev.filter(
            i => !(i.id === id && i.type === type)
        );
        saveItems(newItems);
    }, []);

    const clearAll = useCallback(() => {
        setItems([]);
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event(CHANGE_EVENT));
    }, []);

    const removePath = useCallback((path: string) => {
        saveItems(getStoredItems().filter(item => item.path !== path && !item.path.startsWith(`${path}/`)));
    }, []);

    return { items, addItem, removeItem, removePath, clearAll };
}
