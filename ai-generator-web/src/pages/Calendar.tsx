import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { hr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css'; // Create this file for overrides

import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { AppointmentDialog } from '../components/calendar/AppointmentDialog';
import type { Appointment } from '../types';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Partial<Appointment> | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

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

    useEffect(() => {
        loadAppointments();
    }, [date, view]);

    const loadAppointments = async () => {
        setLoading(true);
        try {
            // Calculate range based on view
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

            const data = await appointmentService.getAll(start, end);

            const calendarEvents: CalendarEvent[] = data.map(apt => {
                const assigneesNames = apt.assignees?.map(a => `${a.name} ${a.last_name}`).join(', ') || '';
                return {
                    id: apt.id,
                    title: `${apt.title} (${assigneesNames})`,
                    start: new Date(apt.start_time),
                    end: new Date(apt.end_time),
                    resource: apt
                };
            });

            setEvents(calendarEvents);
        } catch (error) {
            console.error('Failed to load appointments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
        setSelectedSlot({ start, end });
        setSelectedAppointment(null);
        setDialogOpen(true);
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedAppointment(event.resource);
        setDialogOpen(true);
    };

    const handleSave = async (appointment: Partial<Appointment>) => {
        try {
            if (appointment.id) {
                // @ts-ignore - appointmentService handles assignee_ids
                await appointmentService.update(appointment.id, appointment);
            } else {
                // @ts-ignore
                await appointmentService.create(appointment);
            }
            await loadAppointments();
        } catch (error) {
            console.error('Failed to save appointment', error);
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await appointmentService.delete(id);
            await loadAppointments();
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
                {loading && (
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
