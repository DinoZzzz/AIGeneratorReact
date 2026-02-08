export const CardSkeleton = () => (
  <div className="p-6 bg-card rounded-xl border border-border animate-pulse">
    <div className="flex items-center">
      <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg" />
      <div className="ml-5 w-0 flex-1 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-8 bg-muted rounded w-1/2" />
      </div>
    </div>
  </div>
);

export const StatsCardsSkeleton = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </div>
);
