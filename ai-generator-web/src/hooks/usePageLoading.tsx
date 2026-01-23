import React from 'react';

interface PageSkeletonProps {
    showHeader?: boolean;
    showCards?: boolean;
    showTable?: boolean;
}

/**
 * A consistent page loading skeleton component.
 * Used across different pages to provide uniform loading states.
 */
export const PageSkeleton = ({
    showHeader = true,
    showCards = false,
    showTable = true
}: PageSkeletonProps) => (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-pulse">
        {showHeader && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
                <div className="space-y-2">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
        )}

        {showCards && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                            <div className="ml-5 w-0 flex-1 space-y-3">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {showTable && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                {/* Table header */}
                <div className="border-b border-border p-4">
                    <div className="flex justify-between items-center">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                    </div>
                </div>
                {/* Table rows */}
                <div className="divide-y divide-border">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 flex items-center space-x-4">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

/**
 * Hook for consistent loading states across pages.
 * Returns a skeleton component if loading, null otherwise.
 *
 * @example
 * const loadingSkeleton = usePageLoading(isLoading, { showCards: true });
 * if (loadingSkeleton) return loadingSkeleton;
 */
export const usePageLoading = (
    isLoading: boolean,
    options: PageSkeletonProps = {}
): React.ReactNode | null => {
    if (isLoading) {
        return <PageSkeleton {...options} />;
    }
    return null;
};

export default usePageLoading;
