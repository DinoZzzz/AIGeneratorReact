import { useState, useEffect, useCallback } from 'react';

export interface PinnedItem {
    id: string;
    type: 'customer' | 'construction';
    name: string;
    subtext?: string;
    path: string;
    pinnedAt: number;
}

const STORAGE_KEY = 'pinned-items';
const MAX_ITEMS = 10;

function getStoredItems(): PinnedItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // Corrupted data
    }
    return [];
}

function saveItems(items: PinnedItem[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // Storage full
    }
}

export function usePinnedItems() {
    const [items, setItems] = useState<PinnedItem[]>(getStoredItems);

    // Sync across tabs
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                setItems(getStoredItems());
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const pin = useCallback((item: Omit<PinnedItem, 'pinnedAt'>) => {
        setItems(prev => {
            const filtered = prev.filter(i => !(i.id === item.id && i.type === item.type));
            const newItems = [{ ...item, pinnedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
            saveItems(newItems);
            return newItems;
        });
    }, []);

    const unpin = useCallback((id: string, type: PinnedItem['type']) => {
        setItems(prev => {
            const newItems = prev.filter(i => !(i.id === id && i.type === type));
            saveItems(newItems);
            return newItems;
        });
    }, []);

    const isPinned = useCallback((id: string, type: PinnedItem['type']) => {
        return items.some(i => i.id === id && i.type === type);
    }, [items]);

    const togglePin = useCallback((item: Omit<PinnedItem, 'pinnedAt'>) => {
        if (items.some(i => i.id === item.id && i.type === item.type)) {
            unpin(item.id, item.type);
            return false;
        } else {
            pin(item);
            return true;
        }
    }, [items, pin, unpin]);

    return { items, pin, unpin, isPinned, togglePin };
}
