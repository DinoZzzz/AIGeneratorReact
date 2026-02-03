import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Toast } from '../components/ui/Toast';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onUndo?: () => void;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    successWithUndo: (message: string, onUndo: () => void, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Configuration
const MAX_VISIBLE_TOASTS = 3;
const DEDUP_WINDOW_MS = 2000; // Deduplicate identical messages within 2 seconds

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visibleToasts, setVisibleToasts] = useState<ToastItem[]>([]);
    const queueRef = useRef<ToastItem[]>([]);
    const recentMessagesRef = useRef<Map<string, number>>(new Map());

    // Clean up old entries from recent messages map
    useEffect(() => {
        const cleanup = setInterval(() => {
            const now = Date.now();
            recentMessagesRef.current.forEach((timestamp, key) => {
                if (now - timestamp > DEDUP_WINDOW_MS) {
                    recentMessagesRef.current.delete(key);
                }
            });
        }, DEDUP_WINDOW_MS);

        return () => clearInterval(cleanup);
    }, []);

    // Process queue when visible toasts change
    useEffect(() => {
        if (visibleToasts.length < MAX_VISIBLE_TOASTS && queueRef.current.length > 0) {
            const nextToast = queueRef.current.shift();
            if (nextToast) {
                setVisibleToasts(prev => [...prev, nextToast]);
            }
        }
    }, [visibleToasts.length]);

    const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
        // Create dedup key from message and type
        const dedupKey = `${type}:${message}`;
        const now = Date.now();

        // Check for duplicate within time window
        const lastShown = recentMessagesRef.current.get(dedupKey);
        if (lastShown && now - lastShown < DEDUP_WINDOW_MS) {
            return; // Skip duplicate
        }

        // Record this message
        recentMessagesRef.current.set(dedupKey, now);

        const id = Math.random().toString(36).substr(2, 9);
        const newToast: ToastItem = { id, message, type, duration };

        setVisibleToasts(prev => {
            if (prev.length < MAX_VISIBLE_TOASTS) {
                return [...prev, newToast];
            }
            // Queue if at max capacity
            queueRef.current.push(newToast);
            return prev;
        });
    }, []);

    const removeToast = useCallback((id: string) => {
        setVisibleToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((message: string, duration?: number) => addToast(message, 'success', duration), [addToast]);
    const error = useCallback((message: string, duration?: number) => addToast(message, 'error', duration), [addToast]);
    const info = useCallback((message: string, duration?: number) => addToast(message, 'info', duration), [addToast]);

    const successWithUndo = useCallback((message: string, onUndo: () => void, duration: number = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: ToastItem = { id, message, type: 'success', duration, onUndo };

        setVisibleToasts(prev => {
            if (prev.length < MAX_VISIBLE_TOASTS) {
                return [...prev, newToast];
            }
            queueRef.current.push(newToast);
            return prev;
        });
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, success, error, info, successWithUndo }}>
            {children}
            <div className="fixed top-0 inset-x-0 sm:right-0 sm:left-auto p-4 sm:p-6 space-y-4 z-[100] flex flex-col items-center sm:items-end pointer-events-none">
                {visibleToasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        type={toast.type}
                        message={toast.message}
                        duration={toast.duration}
                        onClose={removeToast}
                        onUndo={toast.onUndo}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
