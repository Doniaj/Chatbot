import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { FC } from "react";
import { Calendar, momentLocalizer, SlotInfo, ToolbarProps, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendar.css";
import Sidebar from "./Sidebar";
import { Availability } from "../../../types/types";
import availabilityApiService from "../../../util/services/AvailabilityApiService";
import usersApiService from "../../../util/services/UsersApiService";
import AddEventModal from "./AddEventModal";
import { Button, message, Badge } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const localizer = momentLocalizer(moment);

interface CalendarEvent extends Availability {
    title: string;
    start: Date;
    end: Date;
    type: string;
    notes?: string;
    backgroundColor?: string;
    borderColor?: string;
    originalEvents?: (CalendarEvent | AppointmentEvent)[];
    originalLeaveDetails?: any;
}

interface AppointmentEvent extends CalendarEvent {
    id: number;
    client?: {
        first_name: string;
        last_name: string;
    };
    user_id: number;
    client_id?: number;
    notes?: string;
    status: string;
}

interface DayEventCounts {
    [date: string]: {
        appointments: number;
        leaves: number;
        appointmentEvents: AppointmentEvent[];
        leaveEvents: CalendarEvent[];
    };
}

// Custom component for events in month view
const EventComponent: FC<{ event: CalendarEvent }> = ({ event }) => {
    // Check if this is a grouped event indicator
    if (event.originalEvents && event.originalEvents.length > 0) {
        const count = event.originalEvents.length;
        const style = {
            backgroundColor: event.backgroundColor || '#f0f0f0',
            border: `1px solid ${event.borderColor || '#d9d9d9'}`,
            borderRadius: '4px',
            color: '#000',
            padding: '2px 5px',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
        };

        return (
            <div style={style}>
                <span>{event.title}</span>
                <Badge count={count} size="small" />
            </div>
        );
    }

    // Regular single event
    const style = {
        backgroundColor: event.backgroundColor || '#f0f0f0',
        border: `1px solid ${event.borderColor || '#d9d9d9'}`,
        borderRadius: '4px',
        color: '#000',
        padding: '2px 5px',
        fontSize: '12px',
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    };

    return (
        <div style={style}>
            {event.title}
        </div>
    );
};

const AdminCalendar: React.FC = () => {
    const { t, i18n } = useTranslation();
    document.title = t('Calendar');
    const [originalEvents, setOriginalEvents] = useState<(CalendarEvent | AppointmentEvent)[]>([]);
    const [groupedEvents, setGroupedEvents] = useState<CalendarEvent[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<(CalendarEvent | AppointmentEvent)[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | AppointmentEvent | null>(null);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [dayEventCounts, setDayEventCounts] = useState<DayEventCounts>({});
    const [calendarView, setCalendarView] = useState<View>("month");
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    useEffect(() => {
        setIsLoading(true);
        usersApiService.getCurrentUser()
            .then(response => {
                if (response.data && response.data.user) {
                    const userId = response.data.user.user_id;
                    setCurrentUserId(userId);
                }
            })
            .catch(error => {
                console.error("Error fetching current user:", error);
                message.error(t('fail-catch'));
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (currentUserId) {
            fetchAllAvailability();
        }
    }, [currentUserId, refreshTrigger]);

    useEffect(() => {
        if (calendarView === "month") {
            groupEventsByDay();
        } else {
            setGroupedEvents(originalEvents);
        }
    }, [originalEvents, calendarView]);

    const fetchAllAvailability = () => {
        setIsLoading(true);

        const requestBody = {
            filter: [
                {
                    operator: "and",
                    conditions: [
                        {
                            field: "user_id",
                            operator: "eq",
                            value: currentUserId
                        },
                        {
                            field: "active",
                            operator: "eq",
                            value: "Y"
                        }
                    ]
                }
            ],
            includes: ["user", "client"],
            limit: 1000,
            offset: 0
        };

        availabilityApiService.getAvailabilityByUser(currentUserId, requestBody)
            .then(response => {
                console.log("Availability response:", response);
                if (response.data && (response.data.data || response.data)) {
                    const availabilityData = response.data.data || response.data;

                    if (Array.isArray(availabilityData)) {
                        console.log("Processing availability data array:", availabilityData);
                        processAvailabilityData(availabilityData);
                    } else {
                        console.error("Invalid availability data format:", availabilityData);
                        message.error(t('fail-catch'));
                    }
                } else {
                    console.error("Invalid response structure:", response);
                    message.error(t('fail-catch'));
                }
            })
            .catch(error => {
                console.error("Error fetching availability:", error);
                message.error(t('fail-catch'));
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const processAvailabilityData = (data: any[]) => {
        console.log("Raw availability data:", data);
        console.log("Data types in array:", data.map(item => item.type));

        // Filter and map leave events with support for multi-day and hours-based leaves
        const leaveEvents: CalendarEvent[] = [];

        const leaveItems = data.filter((item: any) => item.type === 'leave');
        console.log("Leave items found:", leaveItems.length);

        leaveItems.forEach((item: any) => {
            const startDate = moment(item.start_date);
            const endDate = moment(item.end_date);
            const isFullDayLeave =
                item.start_time === '00:00:00' &&
                item.end_time === '23:59:59';

            const isHoursLeave =
                startDate.isSame(endDate, 'day') &&
                item.start_time !== '00:00:00' &&
                item.end_time !== '23:59:59';

            let currentDate = startDate.clone();
            while (currentDate.isSameOrBefore(endDate, 'day')) {
                const eventStart = new Date(`${currentDate.format('YYYY-MM-DD')}T${isHoursLeave ? item.start_time : '00:00:00'}`);
                const eventEnd = new Date(`${currentDate.format('YYYY-MM-DD')}T${isHoursLeave ? item.end_time : '23:59:59'}`);

                leaveEvents.push({
                    id: item.id || item.availability_id,
                    title: t('leave'),
                    start: eventStart,
                    end: eventEnd,
                    type: 'leave',
                    active: item.active,
                    status: item.status,
                    notes: item.notes,
                    user_id: item.user_id,
                    backgroundColor: isHoursLeave ? '#e6f7ff' : '#fff1f0', // Different color for hours leave
                    borderColor: isHoursLeave ? '#1890ff' : '#ffa39e',
                    // Add original item details for reference
                    originalLeaveDetails: item
                });

                currentDate.add(1, 'day');
            }
        });

        console.log("Created leave events:", leaveEvents.length);

        // Filter and map appointment events with case-insensitive check
        const appointmentItems = data.filter((item: any) => {
            const isAppointment = item.type &&
                (item.type.toLowerCase() === 'appointment' || item.type === 'Appointment');
            return isAppointment;
        });

        console.log("Appointment items found:", appointmentItems);
        console.log("Number of appointment items:", appointmentItems.length);

        const appointmentEvents = appointmentItems.map((item: any) => {
            console.log("Creating appointment event from:", item);

            // Create standardized appointment event
            const appointmentEvent = {
                id: item.id || item.availability_id,
                title: t('appointment'),
                start: new Date(`${item.appointment_date || item.start_date}T${item.start_time}`),
                end: new Date(`${item.appointment_date || item.start_date}T${item.end_time}`),
                type: 'appointment', // Ensure lowercase consistency
                user_id: item.user_id,
                client_id: item.client_id,
                client: item.client,
                status: item.status,
                active: item.active,
                notes: item.notes,
                backgroundColor: '#e6f7ff',
                borderColor: '#1890ff',
            };

            console.log("Created appointment event:", appointmentEvent);
            return appointmentEvent;
        });

        console.log("Created appointment events:", appointmentEvents);
        console.log("Number of appointment events created:", appointmentEvents.length);

        // Combine all events for tracking
        const allEvents = [...leaveEvents, ...appointmentEvents];
        console.log("Combined events:", allEvents);
        console.log("Total events:", allEvents.length);
        console.log("Types in combined events:", allEvents.map(e => e.type));

        setOriginalEvents(allEvents);

        // Calculate event counts per day
        calculateDayEventCounts(leaveEvents, appointmentEvents);

        // Update selected events or selected event if needed
        updateSelectedEventsAfterRefresh(allEvents);
    };

    // Update selected events after a refresh
    const updateSelectedEventsAfterRefresh = (allEvents: (CalendarEvent | AppointmentEvent)[]) => {
        if (selectedEvents && selectedEvents.length > 0 && selectedDate) {
            // If we had selected events for a specific date, update them with fresh data
            const dateStr = moment(selectedDate).format('YYYY-MM-DD');
            const newSelectedEvents = allEvents.filter(event => {
                const eventDateStr = moment(event.start).format('YYYY-MM-DD');
                return eventDateStr === dateStr;
            });

            if (newSelectedEvents.length > 0) {
                setSelectedEvents(newSelectedEvents);
            } else {
                // No events left for this date
                setSelectedEvents([]);
                if (sidebarOpen) {
                    setSidebarOpen(false);
                }
            }
        } else if (selectedEvent && selectedEvent.id) {
            // If we had a single selected event, check if it still exists
            const updatedEvent = allEvents.find(event => event.id === selectedEvent.id);
            if (updatedEvent) {
                setSelectedEvent(updatedEvent);
            } else {
                // Event was deleted
                setSelectedEvent(null);
                if (sidebarOpen) {
                    setSidebarOpen(false);
                }
            }
        }
    };

    const calculateDayEventCounts = (leaveEvents: CalendarEvent[], appointmentEvents: AppointmentEvent[]) => {
        const counts: DayEventCounts = {};

        // Process appointment events
        appointmentEvents.forEach(event => {
            const dateStr = moment(event.start).format('YYYY-MM-DD');

            if (!counts[dateStr]) {
                counts[dateStr] = {
                    appointments: 0,
                    leaves: 0,
                    appointmentEvents: [],
                    leaveEvents: []
                };
            }

            counts[dateStr].appointments++;
            counts[dateStr].appointmentEvents.push(event);
        });

        // Process leave events
        leaveEvents.forEach(event => {
            // For multi-day leaves, create entries for each day in the range
            const startDate = moment(event.start);
            const endDate = moment(event.end);
            const currentDate = startDate.clone();

            while (currentDate.isSameOrBefore(endDate, 'day')) {
                const dateStr = currentDate.format('YYYY-MM-DD');

                if (!counts[dateStr]) {
                    counts[dateStr] = {
                        appointments: 0,
                        leaves: 0,
                        appointmentEvents: [],
                        leaveEvents: []
                    };
                }

                counts[dateStr].leaves++;

                // Only add the event once per day
                if (!counts[dateStr].leaveEvents.some(e => e.id === event.id)) {
                    counts[dateStr].leaveEvents.push(event);
                }

                currentDate.add(1, 'day');
            }
        });

        setDayEventCounts(counts);
    };

    const groupEventsByDay = () => {
        const grouped: { [key: string]: CalendarEvent[] } = {};

        // Group appointments and leaves by day
        originalEvents.forEach(event => {
            const dateStr = moment(event.start).format('YYYY-MM-DD');

            if (!grouped[dateStr]) {
                grouped[dateStr] = [];
            }

            grouped[dateStr].push(event);
        });

        // Create consolidated events for each day
        const consolidatedEvents: CalendarEvent[] = [];

        Object.keys(grouped).forEach(dateStr => {
            const dayEvents = grouped[dateStr];
            const appointments = dayEvents.filter(e => e.type === 'appointment');
            const leaves = dayEvents.filter(e => e.type === 'leave');

            // If we have appointments for this day, create one appointment group event
            if (appointments.length > 0) {
                const firstEvent = appointments[0];
                consolidatedEvents.push({
                    id: Number(`${Date.now()}-${Math.random()}`),
                    title: `${t('appointments')}${appointments.length > 1 ? 's' : ''}`,
                    start: new Date(dateStr + 'T09:00:00'),
                    end: new Date(dateStr + 'T09:30:00'),
                    type: 'appointment-group',
                    backgroundColor: '#e6f7ff',
                    borderColor: '#1890ff',
                    originalEvents: appointments
                });
            }

            // If we have leaves for this day, create one leave group event
            if (leaves.length > 0) {
                const firstEvent = leaves[0];
                consolidatedEvents.push({
                    id: Number(`${Date.now()}-${Math.random()}`),
                    title: `${t('leaves')}${leaves.length > 1 ? 's' : ''}`,
                    start: new Date(dateStr + 'T10:00:00'),
                    end: new Date(dateStr + 'T10:30:00'),
                    type: 'leave-group',
                    backgroundColor: '#fff1f0',
                    borderColor: '#ffa39e',
                    originalEvents: leaves
                });
            }
        });

        setGroupedEvents(consolidatedEvents);
    };

    // Update the handleSelectEvent method
    const handleSelectEvent = (event: CalendarEvent | AppointmentEvent) => {
        // If this is a grouped event, show all events in the sidebar
        if (event.originalEvents && event.originalEvents.length > 0) {
            // Determine the type based on the original events
            const eventTypes = event.originalEvents.map(e => e.type);
            const isAllAppointments = eventTypes.every(type => type.toLowerCase() === 'appointment');
            const isAllLeaves = eventTypes.every(type => type.toLowerCase() === 'leave');

            let viewType = 'mixed';
            if (isAllAppointments) viewType = 'appointment-group';
            if (isAllLeaves) viewType = 'leave-group';

            // Store the view type
            localStorage.setItem('viewingEventType', viewType);

            setSelectedEvents(event.originalEvents);
            setSelectedEvent(null); // Clear selected event as we're showing multiple
            setSelectedDate(event.start);
            setSidebarOpen(true);
        } else {
            // Regular single event handling
            // Store the type of single event we're viewing
            const eventType = event.type.toLowerCase();
            localStorage.setItem('viewingEventType',
                eventType === 'appointment' ? 'appointment' :
                    eventType === 'leave' ? 'leave' :
                        'mixed'
            );

            setSelectedEvent(event);
            setSelectedEvents([]);
            setSidebarOpen(true);
        }
    };

    const refreshCalendarData = async (): Promise<void> => {
        const viewingEventType = localStorage.getItem('viewingEventType') || 'all';

        setRefreshTrigger(prev => prev + 1);

        console.log('Refreshing with event type:', viewingEventType);
    };
    const handleSelectSlot = (slotInfo: SlotInfo) => {
        setSelectedDate(slotInfo.start);
        setModalOpen(true);
    };

    const handleViewChange = (view: View) => {
        setCalendarView(view);
    };



    const handleEventAdded = () => {
        refreshCalendarData();
        message.success(t('appointment-updated'));
    };

    const DateCellWrapper = ({ value, children }: any) => {
        const dateObj = value;
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        const counts = dayEventCounts[dateStr] || { appointments: 0, leaves: 0 };

        return (
            <div className="rbc-day-bg position-relative">
                {children}
                {counts.appointments > 0 && (
                    <div className="appointment-count-badge">
                        <Badge
                            count={counts.appointments}
                            style={{
                                backgroundColor: '#1890ff',
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                zIndex: 5
                            }}
                        />
                    </div>
                )}
            </div>
        );
    };

    const CustomToolbar: FC<ToolbarProps<CalendarEvent, object>> = ({ label, onNavigate, onView, view }) => {
        return (
            <div className="rbc-toolbar" style={{
                padding: '8px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <button
                        onClick={() => onNavigate("TODAY")}
                        className="toolbar-button today-btn"
                    >
                        {t('today')}
                    </button>
                    <button
                        onClick={() => onNavigate("PREV")}
                        className="toolbar-button prev-btn"
                    >
                        {t('prev')}
                    </button>
                    <button
                        onClick={() => onNavigate("NEXT")}
                        className="toolbar-button next-btn"
                    >
                        {t('next')}
                    </button>
                </div>
                <span className="ml-4">{label}</span>
                <div className="rbc-btn-group">
                    <button
                        type="button"
                        onClick={() => onView("month")}
                        className={`toolbar-button ${view === "month" ? "rbc-active" : ""}`}
                    >
                        {t('month')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onView("week")}
                        className={`toolbar-button ${view === "week" ? "rbc-active" : ""}`}
                    >
                        {t('week')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onView("day")}
                        className={`toolbar-button ${view === "day" ? "rbc-active" : ""}`}
                    >
                        {t('day')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onView("agenda")}
                        className={`toolbar-button ${view === "agenda" ? "rbc-active" : ""}`}
                    >
                        {t('agenda')}
                    </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => {
                            setSelectedDate(new Date());
                            setModalOpen(true);
                        }}
                        className="toolbar-button add-event-button mr-2"
                        style={{ marginRight: '10px' }}
                    >
                        <PlusOutlined style={{ marginRight: '5px' }} /> {t('add-event')}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            width: '100%'
        }}>
            <div style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: sidebarOpen ? 'calc(100% - 320px)' : '100%',
                    transition: 'width 0.3s ease',
                    padding: '0 0.5rem',
                    height: '100%',
                    overflow: 'auto'
                }}>
                    <Calendar
                        localizer={localizer}
                        events={calendarView === "month" ? groupedEvents : originalEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{
                            height: "calc(100vh - 50px)",
                            marginTop: "65px"
                        }}
                        selectable
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        views={["month", "week", "day", "agenda"]}
                        defaultView="month"
                        onView={handleViewChange}
                        toolbar={true}
                        components={{
                            toolbar: CustomToolbar,
                            event: EventComponent,
                            dateCellWrapper: DateCellWrapper
                        }}
                    />
                </div>

                {sidebarOpen && (
                    <div style={{
                        width: '320px',
                        height: '100%',
                        backgroundColor: 'white',
                        boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
                        borderLeft: '1px solid #e5e7eb',
                        overflow: 'hidden',
                        flexShrink: 0,
                        position: 'relative'
                    }}>
                        <Sidebar
                            key={refreshTrigger} // Force re-render on refresh
                            event={selectedEvent}
                            events={selectedEvents}
                            selectedDate={selectedDate}
                            setSidebarOpen={setSidebarOpen}
                            refreshAvailability={refreshCalendarData}
                        />
                    </div>
                )}

                <AddEventModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSuccess={handleEventAdded}
                    selectedDate={selectedDate}
                />
            </div>
        </div>
    );
};

export default AdminCalendar;