import { useState } from 'react';
import type { ReportForm } from '../../../types';

export const useReportsFiltering = (reports: ReportForm[]) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'satisfies' | 'failed'>('all');
    const [dateFilter, setDateFilter] = useState('');

    const filterReports = (typeReports: ReportForm[]) => {
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
    };

    // Split reports by type
    const airReports = reports.filter(report => report.type_id === 2 || (!report.type_id && report.section_name && report.material_type_id === 2));
    const waterReports = reports.filter(report => report.type_id === 1 || (!report.type_id && report.section_name && report.material_type_id === 1));

    const filteredAirReports = filterReports(airReports);
    const filteredWaterReports = filterReports(waterReports);

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
