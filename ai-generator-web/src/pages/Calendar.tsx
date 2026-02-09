import { useState, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { hr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css'; // Create this file for overrides

import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { AppointmentDialog } from '../components/calendar/AppointmentDialog';
import { CalendarSkeleton } from '../components/skeletons/CalendarSkeleton';
import type { Appointment, AppointmentPayload } from '../types';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
    useAppointmentsInRange,
    useCreateAppointment,
    useDeleteAppointment,
    useUpdateAppointment
} from '../hooks/useAppointments';

const locales = {
    'hr': hr,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: Appointment;
}

export const Calendar = () => {
    const { t } = useLanguage();
    const { profile } = useAuth();
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Partial<Appointment> | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
    const createAppointmentMutation = useCreateAppointment();
    const updateAppointmentMutation = useUpdateAppointment();
    const deleteAppointmentMutation = useDeleteAppointment();

    // Set default view based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setView(Views.DAY);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const visibleRange = useMemo(() => {
        let start = new Date(date.getFullYear(), date.getMonth(), 1);
        let end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        if (view === Views.WEEK) {
            start = startOfWeek(date, { weekStartsOn: 1 });
            end = new Date(start);
            end.setDate(end.getDate() + 7);
        } else if (view === Views.DAY) {
            start = new Date(date);
            start.setHours(0, 0, 0, 0);
            end = new Date(date);
            end.setHours(23, 59, 59, 999);
        }

        // Add buffer
        start.setDate(start.getDate() - 7);
        end.setDate(end.getDate() + 7);

        return { start, end };
    }, [date, view]);

    const appointmentsQuery = useAppointmentsInRange(visibleRange.start, visibleRange.end);
    const events: CalendarEvent[] = useMemo(
        () =>
            (appointmentsQuery.data || []).map((appointment) => ({
                id: appointment.id,
                title: appointment.title,
                start: new Date(appointment.start),
                end: new Date(appointment.end),
                resource: appointment
            })),
        [appointmentsQuery.data]
    );

    const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
        setSelectedSlot({ start, end });
        setSelectedAppointment(null);
        setDialogOpen(true);
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedAppointment(event.resource);
        setDialogOpen(true);
    };

    const handleSave = async (appointment: AppointmentPayload) => {
        try {
            if (appointment.id) {
                await updateAppointmentMutation.mutateAsync({ id: appointment.id, appointment });
            } else {
                await createAppointmentMutation.mutateAsync(appointment);
            }
            await appointmentsQuery.refetch();
        } catch (error) {
            console.error('Failed to save appointment', error);
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteAppointmentMutation.mutateAsync(id);
            await appointmentsQuery.refetch();
        } catch (error) {
            console.error('Failed to delete appointment', error);
            throw error;
        }
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        const isMyEvent = event.resource.assignees?.some(a => a.id === profile?.id);
        const style = {
            backgroundColor: isMyEvent ? '#2563eb' : '#64748b',
            borderRadius: '4px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block'
        };
        return { style };
    };

    // Show skeleton on initial load
    if (appointmentsQuery.isLoading) {
        return <CalendarSkeleton />;
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('calendar.title')}</h1>
                    <p className="text-muted-foreground">{t('calendar.subtitle')}</p>
                </div>
                <Button onClick={() => { setSelectedAppointment(null); setSelectedSlot(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('calendar.newEvent')}
                </Button>
            </div>

            <div className="flex-1 bg-card rounded-lg shadow p-4 border border-border">
                {appointmentsQuery.isFetching && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    culture="hr"
                    messages={{
                        next: t('calendar.next'),
                        previous: t('calendar.previous'),
                        today: t('calendar.today'),
                        month: t('calendar.month'),
                        week: t('calendar.week'),
                        day: t('calendar.day'),
                        agenda: t('calendar.agenda'),
                        date: t('calendar.date'),
                        time: t('calendar.time'),
                        event: t('calendar.event'),
                        noEventsInRange: t('calendar.noEvents'),
                    }}
                />
            </div>

            <AppointmentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                appointment={selectedAppointment}
                selectedSlot={selectedSlot}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    );
};
