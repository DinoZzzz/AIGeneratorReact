export const CalendarSkeleton = () => (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <div className="h-7 bg-muted rounded w-32 animate-pulse" />
                <div className="h-4 bg-muted rounded w-48 animate-pulse" />
            </div>
            <div className="h-10 bg-muted rounded w-32 animate-pulse" />
        </div>

        {/* Calendar grid skeleton */}
        <div className="flex-1 bg-card rounded-lg shadow p-4 border border-border">
            {/* Calendar header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                    <div className="h-8 bg-muted rounded w-20 animate-pulse" />
                    <div className="h-8 bg-muted rounded w-20 animate-pulse" />
                </div>
                <div className="h-6 bg-muted rounded w-32 animate-pulse" />
                <div className="flex space-x-2">
                    <div className="h-8 bg-muted rounded w-16 animate-pulse" />
                    <div className="h-8 bg-muted rounded w-16 animate-pulse" />
                    <div className="h-8 bg-muted rounded w-16 animate-pulse" />
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1 flex-1">
                {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="h-20 bg-muted/50 rounded border border-border animate-pulse" />
                ))}
            </div>
        </div>
    </div>
);
