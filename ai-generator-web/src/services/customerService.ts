import { supabase } from '../lib/supabase';
import { captureError } from '../lib/sentry';
import type { Customer } from '../types';
import { AppError, NotFoundError } from '../lib/errorHandler';

export const customerService = {
    async getAll() {
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, location, work_order, address, created_at')
            .order('name');

        if (error) {
            captureError(error, { service: 'customerService', method: 'getAll' });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data;
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
            .select('id, name, location, work_order, address, created_at', { count: 'exact' });

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

        const { data, error, count } = await query.range(start, end);

        if (error) {
            captureError(error, { service: 'customerService', method: 'getCustomers', page, sortBy });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
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

        const { data, error, count } = await query.range(start, end);

        if (error) {
            captureError(error, { service: 'customerService', method: 'getCustomersWithActivity', page });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return { data: data || [], count: count || 0 };
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            captureError(error, { service: 'customerService', method: 'getById', id });
            if (error.code === 'PGRST116') {
                throw new NotFoundError('Customer');
            }
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data;
    },

    async create(customer: Partial<Customer>) {
        const { data, error } = await supabase
            .from('customers')
            .insert([customer])
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'customerService', method: 'create' });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data;
    },

    async update(id: string, customer: Partial<Customer>) {
        const { data, error } = await supabase
            .from('customers')
            .update(customer)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'customerService', method: 'update', id });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data;
    },

    async delete(id: string) {
        // First delete related appointments
        const { error: appointmentsError } = await supabase
            .from('calendar_events')
            .delete()
            .eq('customer_id', id);

        if (appointmentsError) {
            captureError(appointmentsError, { service: 'customerService', method: 'delete', step: 'deleteAppointments', id });
            throw new AppError(appointmentsError.message, 'SUPABASE_ERROR', 500);
        }

        // Then delete the customer
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) {
            captureError(error, { service: 'customerService', method: 'delete', id });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
    },

    async checkWorkOrderExists(workOrder: string, excludeId?: string) {
        let query = supabase
            .from('customers')
            .select('id')
            .eq('work_order', workOrder);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;
        if (error) {
            captureError(error, { service: 'customerService', method: 'checkWorkOrderExists', workOrder });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
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

        const { data, error } = await query;
        if (error) {
            captureError(error, { service: 'customerService', method: 'checkNameExists', name });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data.length > 0;
    }
};
