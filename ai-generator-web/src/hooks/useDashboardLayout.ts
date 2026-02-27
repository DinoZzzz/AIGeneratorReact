import { useCallback, useSyncExternalStore } from 'react';

export type WidgetId = 'pinnedItems' | 'recentReports' | 'quickActions' | 'activityFeed' | 'dashboardStats' | 'customersTable';

interface DashboardLayout {
    visibleWidgets: Record<WidgetId, boolean>;
}

const STORAGE_KEY = 'dashboard-layout';

const DEFAULT_LAYOUT: DashboardLayout = {
    visibleWidgets: {
        pinnedItems: true,
        recentReports: true,
        quickActions: true,
        activityFeed: true,
        dashboardStats: true,
        customersTable: true,
    },
};

function getLayout(): DashboardLayout {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_LAYOUT;
        const parsed = JSON.parse(stored) as DashboardLayout;
        // Merge with defaults so new widgets are visible by default
        return {
            visibleWidgets: { ...DEFAULT_LAYOUT.visibleWidgets, ...parsed.visibleWidgets },
        };
    } catch {
        return DEFAULT_LAYOUT;
    }
}

function saveLayout(layout: DashboardLayout) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    window.dispatchEvent(new Event('storage'));
}

// External store for useSyncExternalStore
let cachedLayout = getLayout();

function subscribe(callback: () => void) {
    const handler = () => {
        cachedLayout = getLayout();
        callback();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
}

function getSnapshot() {
    return cachedLayout;
}

export function useDashboardLayout() {
    const layout = useSyncExternalStore(subscribe, getSnapshot);

    const toggleWidget = useCallback((id: WidgetId) => {
        const current = getLayout();
        const updated: DashboardLayout = {
            visibleWidgets: {
                ...current.visibleWidgets,
                [id]: !current.visibleWidgets[id],
            },
        };
        cachedLayout = updated;
        saveLayout(updated);
    }, []);

    const isVisible = useCallback(
        (id: WidgetId) => layout.visibleWidgets[id] ?? true,
        [layout]
    );

    return { layout, toggleWidget, isVisible };
}
