import { useState, useMemo, useCallback } from 'react';
import type { ReportForm } from '../../../types';

export const useReportsFiltering = (reports: ReportForm[]) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'satisfies' | 'failed'>('all');
    const [dateFilter, setDateFilter] = useState('');

    const filterReports = useCallback((typeReports: ReportForm[]) => {
        return typeReports.filter(report => {
            // Sections should always be visible
            const isSection = report.section_name && !report.draft_id;
            if (isSection) return true;

            // Search by dionica/stock
            if (searchTerm && !report.dionica?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !report.stock?.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Filter by status
            if (statusFilter !== 'all') {
                if (statusFilter === 'satisfies' && !report.satisfies) return false;
                if (statusFilter === 'failed' && report.satisfies) return false;
            }

            // Filter by date
            if (dateFilter) {
                const reportDate = new Date(report.examination_date).toISOString().split('T')[0];
                if (reportDate !== dateFilter) return false;
            }

            return true;
        });
    }, [searchTerm, statusFilter, dateFilter]);

    // Split reports by type
    const airReports = useMemo(() =>
        reports.filter(report => report.type_id === 2 || (!report.type_id && report.section_name && report.material_type_id === 2)),
        [reports]
    );
    const waterReports = useMemo(() =>
        reports.filter(report => report.type_id === 1 || (!report.type_id && report.section_name && report.material_type_id === 1)),
        [reports]
    );

    const filteredAirReports = useMemo(() => filterReports(airReports), [filterReports, airReports]);
    const filteredWaterReports = useMemo(() => filterReports(waterReports), [filterReports, waterReports]);

    return {
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        dateFilter,
        setDateFilter,
        airReports,
        waterReports,
        filteredAirReports,
        filteredWaterReports,
    };
};
