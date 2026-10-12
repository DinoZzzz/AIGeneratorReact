import { format } from 'date-fns';

// datetime-local expects the user's wall-clock time, without a UTC offset.
export const formatLocalDateTime = (value: Date | string): string =>
    format(new Date(value), "yyyy-MM-dd'T'HH:mm");
