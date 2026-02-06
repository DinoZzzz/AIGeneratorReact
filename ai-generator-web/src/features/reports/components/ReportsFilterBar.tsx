interface ReportsFilterBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: 'all' | 'satisfies' | 'failed';
    onStatusFilterChange: (value: 'all' | 'satisfies' | 'failed') => void;
    dateFilter: string;
    onDateFilterChange: (value: string) => void;
    t: (key: string) => string;
}

export const ReportsFilterBar = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    dateFilter,
    onDateFilterChange,
    t,
}: ReportsFilterBarProps) => {
    return (
        <div className="bg-card shadow rounded-lg overflow-hidden border border-border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">
                        {t('reports.dionica')}
                    </label>
                    <input
                        type="text"
                        id="search"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                        placeholder={t('reports.searchDionica')}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-1">
                        {t('reports.status')}
                    </label>
                    <select
                        id="status"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'satisfies' | 'failed')}
                    >
                        <option value="all">{t('common.all')}</option>
                        <option value="satisfies">{t('reports.satisfies')}</option>
                        <option value="failed">{t('reports.failed')}</option>
                    </select>
                </div>

                {/* Date Filter */}
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-muted-foreground mb-1">
                        {t('reports.date')}
                    </label>
                    <input
                        type="date"
                        id="date"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                        value={dateFilter}
                        onChange={(e) => onDateFilterChange(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};
