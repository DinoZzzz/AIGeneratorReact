import { useEffect, useRef, useState, useCallback } from 'react';

const AUTOSAVE_PREFIX = 'autosave_';
const DEFAULT_INTERVAL = 30_000; // 30 seconds

interface AutoSaveResult<T> {
    restoredData: T | null;
    clearSavedData: () => void;
    lastSaved: Date | null;
    dismissRestore: () => void;
}

export function useAutoSave<T>(
    key: string,
    data: T,
    interval: number = DEFAULT_INTERVAL
): AutoSaveResult<T> {
    const storageKey = `${AUTOSAVE_PREFIX}${key}`;
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [restoredData, setRestoredData] = useState<T | null>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.data as T;
            }
        } catch {
            // Corrupted data, ignore
        }
        return null;
    });
    const dataRef = useRef(data);
    useEffect(() => {
        dataRef.current = data;
    });

    const clearSavedData = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
        } catch {
            // Ignore storage errors
        }
        setLastSaved(null);
        setRestoredData(null);
    }, [storageKey]);

    const dismissRestore = useCallback(() => {
        setRestoredData(null);
    }, []);

    const save = useCallback(() => {
        try {
            const payload = {
                data: dataRef.current,
                savedAt: new Date().toISOString(),
            };
            localStorage.setItem(storageKey, JSON.stringify(payload));
            setLastSaved(new Date());
        } catch {
            // Storage full or unavailable, silently fail
        }
    }, [storageKey]);

    // Periodic auto-save
    useEffect(() => {
        const timer = setInterval(save, interval);
        return () => clearInterval(timer);
    }, [save, interval]);

    // Save on beforeunload
    useEffect(() => {
        const handleBeforeUnload = () => save();
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [save]);

    return { restoredData, clearSavedData, lastSaved, dismissRestore };
}
