import { supabase } from '../lib/supabase';
import type { Customer } from '../types';
import { execQuery, execQueryRaw } from '../lib/serviceHelpers';

const SERVICE = 'customerService';

const CUSTOMER_COLUMNS = 'id, name, location, work_order, address, created_at';

export const customerService = {
    async getAll() {
        return execQuery({ service: SERVICE, method: 'getAll' }, () =>
            supabase
                .from('customers')
                .select(CUSTOMER_COLUMNS)
                .order('name')
        );
    },

    async getCustomers(
        page: number = 1,
        pageSize: number = 10,
        sortBy: string = 'name',
        sortOrder: 'asc' | 'desc' = 'asc',
        search: string = '',
        year?: string | null
    ) {
        // If sorting by activity, use special query with joins
        if (sortBy === 'last_activity') {
            return this.getCustomersWithActivity(page, pageSize, sortOrder, search, year);
        }

        let query = supabase
            .from('customers')
            .select(CUSTOMER_COLUMNS, { count: 'exact' });

        if (search) {
            // Sanitize search input by removing commas to prevent Supabase OR syntax errors
            const sanitizedSearch = search.replace(/,/g, '');
            if (sanitizedSearch) {
                query = query.or(
                    `name.ilike.%${sanitizedSearch}%,location.ilike.%${sanitizedSearch}%,work_order.ilike.%${sanitizedSearch}%,address.ilike.%${sanitizedSearch}%`
                );
            }
        }

        // Filter by year if provided
        if (year) {
            const yearNum = parseInt(year, 10);
            if (!isNaN(yearNum)) {
                // Use gte and lt to filter by year range
                const startDate = `${yearNum}-01-01`;
                const endDate = `${yearNum + 1}-01-01`;
                query = query.gte('created_at', startDate).lt('created_at', endDate);
            }
        }

        // Map UI sort keys to DB columns if necessary (they seem to match snake_case mostly)
        // Assuming sortBy is passed as the DB column name
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        const { data, count } = await execQueryRaw(
            { service: SERVICE, method: 'getCustomers', page, sortBy },
            () => query.range(start, end)
        );
        return { data, count };
    },

    async getCustomersWithActivity(
        page: number = 1,
        pageSize: number = 10,
        sortOrder: 'asc' | 'desc' = 'desc',
        search: string = '',
        year?: string | null
    ) {
        // Use the database view that computes last_activity_date efficiently
        // This replaces 5 queries with 1 single query
        let query = supabase
            .from('customer_activity')
            .select('id, name, location, work_order, address, created_at, last_activity_date', { count: 'exact' });

        if (search) {
            const sanitizedSearch = search.replace(/,/g, '');
            if (sanitizedSearch) {
                query = query.or(
                    `name.ilike.%${sanitizedSearch}%,location.ilike.%${sanitizedSearch}%,work_order.ilike.%${sanitizedSearch}%,address.ilike.%${sanitizedSearch}%`
                );
            }
        }

        // Filter by year if provided
        if (year) {
            const yearNum = parseInt(year, 10);
            if (!isNaN(yearNum)) {
                const startDate = `${yearNum}-01-01`;
                const endDate = `${yearNum + 1}-01-01`;
                query = query.gte('created_at', startDate).lt('created_at', endDate);
            }
        }

        // Sort by last_activity_date
        query = query.order('last_activity_date', { ascending: sortOrder === 'asc' });

        // Apply pagination
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        const { data, count } = await execQueryRaw(
            { service: SERVICE, method: 'getCustomersWithActivity', page },
            () => query.range(start, end)
        );
        return { data: data || [], count: count || 0 };
    },

    async getById(id: string) {
        return execQuery(
            { service: SERVICE, method: 'getById', id },
            () =>
                supabase
                    .from('customers')
                    .select('*')
                    .eq('id', id)
                    .single(),
            { notFoundEntity: 'Customer' }
        );
    },

    async create(customer: Partial<Customer>) {
        return execQuery({ service: SERVICE, method: 'create' }, () =>
            supabase
                .from('customers')
                .insert([customer])
                .select()
                .single()
        );
    },

    async update(id: string, customer: Partial<Customer>) {
        return execQuery({ service: SERVICE, method: 'update', id }, () =>
            supabase
                .from('customers')
                .update(customer)
                .eq('id', id)
                .select()
                .single()
        );
    },

    async delete(id: string) {
        // First delete related appointments
        await execQuery({ service: SERVICE, method: 'delete', step: 'deleteAppointments', id }, () =>
            supabase
                .from('calendar_events')
                .delete()
                .eq('customer_id', id)
        );

        // Then delete the customer
        await execQuery({ service: SERVICE, method: 'delete', id }, () =>
            supabase
                .from('customers')
                .delete()
                .eq('id', id)
        );
    },

    async checkWorkOrderExists(workOrder: string, excludeId?: string) {
        let query = supabase
            .from('customers')
            .select('id')
            .eq('work_order', workOrder);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const data = await execQuery(
            { service: SERVICE, method: 'checkWorkOrderExists', workOrder },
            () => query
        );
        return data.length > 0;
    },

    async checkNameExists(name: string, excludeId?: string) {
        let query = supabase
            .from('customers')
            .select('id')
            .eq('name', name);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const data = await execQuery(
            { service: SERVICE, method: 'checkNameExists', name },
            () => query
        );
        return data.length > 0;
    }
};
