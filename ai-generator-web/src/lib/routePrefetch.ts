/**
 * Route prefetching utilities for improved navigation performance
 * Prefetches route modules on hover or when the browser is idle
 */

// Cache to track which routes have been prefetched
const prefetchedRoutes = new Set<string>();

// Map of route patterns to their lazy import functions
const routeImports: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/Dashboard'),
  '/customers': () => import('../pages/Customers'),
  '/customers/new': () => import('../pages/CustomerForm'),
  '/reports': () => import('../pages/Reports'),
  '/history': () => import('../pages/History'),
  '/analytics': () => import('../pages/Analytics'),
  '/settings': () => import('../pages/Settings'),
  '/calendar': () => import('../pages/Calendar'),
  '/help': () => import('../pages/Help'),
  '/profile': () => import('../pages/Profile'),
  '/chat': () => import('../pages/Chat'),
  '/examiners': () => import('../pages/Examiners'),
};

// Dynamic route patterns (matched by prefix)
const dynamicRouteImports: Array<{ pattern: RegExp; import: () => Promise<unknown> }> = [
  { pattern: /^\/customers\/[^/]+\/constructions$/, import: () => import('../pages/Constructions') },
  { pattern: /^\/customers\/[^/]+\/constructions\/new$/, import: () => import('../pages/ConstructionForm') },
  { pattern: /^\/customers\/[^/]+\/constructions\/[^/]+\/reports$/, import: () => import('../pages/ConstructionReports') },
  { pattern: /^\/customers\/[^/]+\/constructions\/[^/]+\/reports\/new\/water$/, import: () => import('../pages/WaterMethodForm') },
  { pattern: /^\/customers\/[^/]+\/constructions\/[^/]+\/reports\/new\/air$/, import: () => import('../pages/AirMethodForm') },
  { pattern: /^\/history\/[^/]+$/, import: () => import('../pages/HistoryDetails') },
];

/**
 * Get the import function for a given path
 */
const getImportForPath = (path: string): (() => Promise<unknown>) | null => {
  // Check exact matches first
  if (routeImports[path]) {
    return routeImports[path];
  }

  // Check dynamic patterns
  for (const { pattern, import: importFn } of dynamicRouteImports) {
    if (pattern.test(path)) {
      return importFn;
    }
  }

  return null;
};

/**
 * Prefetch a route module
 */
export const prefetchRoute = (path: string): void => {
  // Skip if already prefetched
  if (prefetchedRoutes.has(path)) {
    return;
  }

  const importFn = getImportForPath(path);
  if (!importFn) {
    return;
  }

  // Mark as prefetched immediately to avoid duplicate requests
  prefetchedRoutes.add(path);

  // Use requestIdleCallback if available, otherwise use setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch(() => {
        // Remove from cache if import fails so it can be retried
        prefetchedRoutes.delete(path);
      });
    });
  } else {
    setTimeout(() => {
      importFn().catch(() => {
        prefetchedRoutes.delete(path);
      });
    }, 100);
  }
};

/**
 * Prefetch multiple routes
 */
export const prefetchRoutes = (paths: string[]): void => {
  paths.forEach(prefetchRoute);
};

/**
 * Handle link hover for prefetching
 * Use this as onMouseEnter handler on navigation links
 */
export const handleLinkHover = (event: React.MouseEvent<HTMLAnchorElement>): void => {
  const href = event.currentTarget.getAttribute('href');
  if (href && href.startsWith('/')) {
    prefetchRoute(href);
  }
};

/**
 * Prefetch common routes during idle time
 * Call this on app mount to preload frequently accessed routes
 */
export const prefetchCommonRoutes = (): void => {
  const commonRoutes = ['/customers', '/reports', '/history', '/analytics'];

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      prefetchRoutes(commonRoutes);
    }, { timeout: 5000 });
  } else {
    setTimeout(() => {
      prefetchRoutes(commonRoutes);
    }, 2000);
  }
};

/**
 * Create a link component wrapper with prefetch on hover
 */
export const createPrefetchProps = (to: string) => ({
  onMouseEnter: () => prefetchRoute(to),
  onFocus: () => prefetchRoute(to),
});
