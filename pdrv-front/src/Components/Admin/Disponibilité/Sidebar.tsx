import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from 'react-redux';
import availabilityApiService from "../../../util/services/AvailabilityApiService";
import "./Calendar.css";
import UpdateEventModal from "./UpdateEventModal";
import { Modal, message, Spin, Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import clientsApiService from "../../../util/services/ClientsApiService";
import moment from "moment";
import usersApiService from "../../../util/services/UsersApiService";

interface SidebarProps {
    event: any | null;
    events: any[] | null;
    selectedDate: Date | null;
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    refreshAvailability: () => Promise<void>;
}

const EVENT_TYPE = {
    APPOINTMENT: 'appointment',
    LEAVE: 'leave',
    APPOINTMENT_GROUP: 'appointment-group',
    LEAVE_GROUP: 'leave-group'
};

const Sidebar: React.FC<SidebarProps> = ({
                                             event,
                                             events,
                                             selectedDate,
                                             setSidebarOpen,
                                             refreshAvailability
                                         }) => {
    const { t } = useTranslation();

    // Get the current theme from Redux store
    const { topbarThemeType } = useSelector((state: any) => ({
        topbarThemeType: state.Layout.topbarThemeType
    }));

    const isDarkMode = topbarThemeType === 'dark';

    const getThemeStyles = () => {
        if (isDarkMode) {
            return {
                container: {
                    backgroundColor: '#212529',
                    borderColor: '#495057',
                    color: '#f8f9fa'
                },
                header: {
                    borderColor: '#0d6efd'
                },
                closeButton: {
                    color: '#dc3545',
                    backgroundColor: '#343a40',
                    '&:hover': {
                        backgroundColor: '#495057'
                    }
                },
                title: {
                    color: '#9ec5fe'
                },
                content: {
                    backgroundColor: '#212529'
                },
                eventItem: {
                    borderColor: '#495057'
                },
                label: {
                    color: '#e9ecef'
                },
                value: {
                    color: '#f8f9fa'
                },
                clientName: {
                    color: '#9ec5fe'
                },
                appointmentHeader: {
                    color: '#9ec5fe',
                    borderColor: '#0d6efd'
                },
                leaveHeader: {
                    color: '#75b798',
                    borderColor: '#146c43'
                },
                leaveType: {
                    color: '#75b798'
                },
                noEvents: {
                    backgroundColor: '#343a40',
                    color: '#adb5bd'
                },
                deleteModal: {
                    backgroundColor: '#343a40',
                    color: '#f8f9fa'
                },
                iconEdit: '#9ec5fe',
                iconDelete: '#f5c2c7'
            };
        } else {
            return {
                container: {
                    backgroundColor: '#ffffff',
                    borderColor: '#dee2e6',
                    color: '#212529'
                },
                header: {
                    borderColor: '#ffffff'
                },
                closeButton: {
                    color: '#dc3545',
                    backgroundColor: '#ffffff',
                    '&:hover': {
                        backgroundColor: '#ffffff'
                    }
                },
                title: {
                    color: '#0d6efd'
                },
                content: {
                    backgroundColor: '#ffffff'
                },
                eventItem: {
                    borderColor: '#dee2e6'
                },
                label: {
                    color: '#495057'
                },
                value: {
                    color: '#6c757d'
                },
                clientName: {
                    color: '#0d6efd'
                },
                appointmentHeader: {
                    color: '#0d6efd',
                    borderColor: '#0d6efd'
                },
                leaveHeader: {
                    color: '#0f5132',
                    borderColor: '#badbcc'
                },
                leaveType: {
                    color: '#198754'
                },
                noEvents: {
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d'
                },
                deleteModal: {
                    backgroundColor: '#e9ecef',
                    color: '#212529'
                },
                iconEdit: '#0d6efd',
                iconDelete: '#dc3545'
            };
        }
    };

    const themeStyles = getThemeStyles();

    const translateString = (key: string): string => {
        const translation = t(key);
        return typeof translation === 'string' ? translation : key;
    };

    const viewingEventType = localStorage.getItem('viewingEventType');
    console.log("Current viewing event type from localStorage:", viewingEventType);

    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isLoadingClient, setIsLoadingClient] = useState<boolean>(false);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(false);
    const [isLoadingLeaves, setIsLoadingLeaves] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // Data state
    const [currentEvent, setCurrentEvent] = useState<any | null>(event);
    const [clientInfoMap, setClientInfoMap] = useState<Map<number, any>>(new Map());
    const [eventToUpdate, setEventToUpdate] = useState<any | null>(null);
    const [eventToDelete, setEventToDelete] = useState<any | null>(null);
    const [appointmentEvents, setAppointmentEvents] = useState<any[]>([]);
    const [leaveEvents, setLeaveEvents] = useState<any[]>([]);

    // Refs for tracking
    const clientFetchedRef = useRef(false);
    const currentDateRef = useRef<Date | null>(selectedDate);
    const originalEventTypeRef = useRef<string | null>(null);
    const viewingGroupRef = useRef<boolean>(false);

    // Helper function to consistently check event type
    const isAppointmentEvent = (event: any): boolean => {
        return event && String(event.type).toLowerCase() === EVENT_TYPE.APPOINTMENT;
    };

    const isLeaveEvent = (event: any): boolean => {
        return event && String(event.type).toLowerCase() === EVENT_TYPE.LEAVE;
    };

    const isAppointmentGroup = (event: any): boolean => {
        return event && event.type === EVENT_TYPE.APPOINTMENT_GROUP;
    };

    const isLeaveGroup = (event: any): boolean => {
        return event && event.type === EVENT_TYPE.LEAVE_GROUP;
    };

    // Helper function to properly parse date objects
    const createDateFromParts = (dateStr: string, timeStr: string): Date => {
        if (!dateStr || !timeStr) {
            console.error("Missing date or time parts:", { dateStr, timeStr });
            return new Date();
        }

        try {
            const [year, month, day] = dateStr.split('-').map(Number);
            const [hours, minutes, seconds] = timeStr.split(':').map(Number);
            const date = new Date(year, month - 1, day, hours, minutes, seconds);

            if (isNaN(date.getTime())) {
                console.error("Invalid date created:", { dateStr, timeStr, date });
                return new Date();
            }

            return date;
        } catch (error) {
            console.error("Error creating date from parts:", { dateStr, timeStr, error });
            return new Date();
        }
    };

    useEffect(() => {
        const getCurrentUser = async () => {
            setIsLoading(true);
            const response = await usersApiService.getCurrentUser();
            if (response.data && response.data.user) {
                setCurrentUserId(response.data.user.user_id);
            } else {
                message.error("No user data found");
            }
            setIsLoading(false);
        };

        getCurrentUser();
    }, []);

    // FETCH CLIENT INFO - Only for a specific client
    const fetchClientInfo = useCallback(async (clientId: number) => {
        if (!clientId) {
            console.log('No client ID provided');
            return;
        }

        if (clientInfoMap.has(clientId)) {
            console.log(`Client ${clientId} already in cache, no need to fetch`);
            return;
        }

        setIsLoadingClient(true);
        console.log(`Fetching client info for ID: ${clientId}`);

        const response = await clientsApiService.getClientById(clientId)
            .catch(error => {
                console.error(`Error fetching client ${clientId}:`, error);
                return null;
            });

        console.log(`Client fetch response for ID ${clientId}:`, response);

        if (response && response.data && Array.isArray(response.data.data)) {
            const matchingClient = response.data.data.find((client: any) =>
                String(client.id) === String(clientId) ||
                String(client.client_id) === String(clientId)
            );

            if (matchingClient) {
                console.log('Found matching client:', matchingClient);

                setClientInfoMap(prevMap => {
                    const newMap = new Map(prevMap);
                    newMap.set(clientId, matchingClient);
                    return newMap;
                });

                updateAppointmentsWithClientInfo(clientId, matchingClient);
            }
        }

        setIsLoadingClient(false);
    }, [clientInfoMap]);

    // Helper to update appointments with client info
    const updateAppointmentsWithClientInfo = useCallback((clientId: number, clientInfo: any) => {
        setAppointmentEvents(prevAppointments =>
            prevAppointments.map(app =>
                app.client_id === clientId
                    ? { ...app, client: clientInfo }
                    : app
            )
        );

        if (currentEvent && currentEvent.client_id === clientId) {
            setCurrentEvent({
                ...currentEvent,
                client: clientInfo
            });
        }
    }, [currentEvent]);

    const fetchAppointmentsForDate = useCallback(async (date: Date) => {
        if (!currentUserId) return;
        if (!date) return;

        const viewingEventType = localStorage.getItem('viewingEventType');
        console.log("Fetching appointments with view type:", viewingEventType);

        if (viewingEventType === 'leave' || viewingEventType === 'leave-group') {
            setAppointmentEvents([]);
            return;
        }

        console.log("FETCHING APPOINTMENTS for date:", date);

        const filterParams = {
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
                        },
                        {
                            field: "type",
                            operator: "eq",
                            value: "appointment"
                        }
                    ]
                }
            ],
            includes: ["user", "client"],
            limit: 1000,
            offset: 0
        };
        setIsLoadingAppointments(true);

        try {
            const formattedDate = moment(date).format('YYYY-MM-DD');
            console.log(`Fetching appointments for date: ${formattedDate}`);

            const response = await availabilityApiService.getAvailabilityByUser(currentUserId, filterParams);

            if (response && response.data && response.data.data) {
                const appointments = response.data.data.filter((e: any) => {
                    const eventDate = moment(e.appointment_date || e.start_date).format('YYYY-MM-DD');
                    return eventDate === formattedDate;
                });

                console.log(`Filtered ${appointments.length} appointments for ${formattedDate}:`, appointments);

                const formattedAppointments = appointments.map((app: any) => {
                    const dateStr = app.appointment_date || app.start_date;

                    return {
                        ...app,
                        start: createDateFromParts(dateStr, app.start_time),
                        end: createDateFromParts(dateStr, app.end_time)
                    };
                });

                console.log("Formatted appointments with proper dates:", formattedAppointments);

                setAppointmentEvents(formattedAppointments);

                const clientIds: number[] = formattedAppointments
                    .filter((app: any) => app.client_id)
                    .map((app: any) => app.client_id);

                const uniqueClientIds: number[] = Array.from(new Set(clientIds)).filter(
                    (id: number) => !clientInfoMap.has(id)
                );

                for (const clientId of uniqueClientIds) {
                    await fetchClientInfo(clientId);
                }
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
            message.error("Failed to fetch appointments");
        } finally {
            setIsLoadingAppointments(false);
        }
    }, [fetchClientInfo, clientInfoMap, createDateFromParts, currentUserId]);

    const fetchLeavesForDate = useCallback(async (date: Date) => {
        if (!currentUserId) return;
        if (!date) return;

        const viewingEventType = localStorage.getItem('viewingEventType');
        console.log("Fetching leaves with view type:", viewingEventType);

        if (viewingEventType === 'appointment' || viewingEventType === 'appointment-group') {
            setLeaveEvents([]);
            return;
        }

        console.log("FETCHING LEAVES for date:", date);

        const filterParams = {
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
                        },
                        {
                            field: "type",
                            operator: "eq",
                            value: "leave"
                        }
                    ]
                }
            ],
            includes: ["user", "client"],
            limit: 1000,
            offset: 0
        };

        setIsLoadingLeaves(true);

        try {
            const formattedDate = moment(date).format('YYYY-MM-DD');
            console.log(`Fetching leaves for date: ${formattedDate}`);

            const response = await availabilityApiService.getAvailabilityByUser(currentUserId, filterParams);

            if (response && response.data && response.data.data) {
                const leaves = response.data.data.filter((e: any) => {
                    const startDate = moment(e.start_date);
                    const endDate = moment(e.end_date);
                    const checkDate = moment(formattedDate);

                    return checkDate.isBetween(startDate, endDate, 'day', '[]');
                });

                console.log(`Filtered ${leaves.length} leaves for ${formattedDate}:`, leaves);

                const formattedLeaves = leaves.map((leave: any) => {
                    return {
                        ...leave,
                        start: createDateFromParts(leave.start_date, leave.start_time),
                        end: createDateFromParts(leave.end_date, leave.end_time)
                    };
                });

                console.log("Formatted leaves with proper dates:", formattedLeaves);

                setLeaveEvents(formattedLeaves);
            }
        } catch (error) {
            console.error("Error fetching leaves:", error);
            message.error("Failed to fetch leaves");
        } finally {
            setIsLoadingLeaves(false);
        }
    }, [createDateFromParts, currentUserId]);

    // Process events
    useEffect(() => {
        console.log("Sidebar received event:", event);
        console.log("Sidebar received events array:", events);

        clientFetchedRef.current = false;
        setCurrentEvent(event);

        const viewingEventType = localStorage.getItem('viewingEventType') || 'all';
        console.log("Viewing event type from localStorage:", viewingEventType);

        if (events && events.length > 0) {
            console.log("Events count:", events.length);
            console.log("Event types:", events.map(e => e.type));

            viewingGroupRef.current = true;

            const allAppointments = events.filter(e => isAppointmentEvent(e));
            const allLeaves = events.filter(e => isLeaveEvent(e));

            let filteredAppointments = allAppointments;
            let filteredLeaves = allLeaves;

            if (viewingEventType === 'appointment-group' || viewingEventType === 'appointment') {
                console.log("Filtering to show only appointments");
                filteredLeaves = [];
            } else if (viewingEventType === 'leave-group' || viewingEventType === 'leave') {
                console.log("Filtering to show only leaves");
                filteredAppointments = [];
            }

            if (filteredAppointments.length === 0 && filteredLeaves.length === 0) {
                filteredAppointments = allAppointments;
                filteredLeaves = allLeaves;
                localStorage.setItem('viewingEventType', 'all');
            }

            if (filteredAppointments.length > 0 && filteredLeaves.length === 0) {
                originalEventTypeRef.current = EVENT_TYPE.APPOINTMENT_GROUP;
                console.log("Viewing APPOINTMENTS group");
            } else if (filteredLeaves.length > 0 && filteredAppointments.length === 0) {
                originalEventTypeRef.current = EVENT_TYPE.LEAVE_GROUP;
                console.log("Viewing LEAVES group");
            } else {
                originalEventTypeRef.current = null;
                console.log("Viewing mixed group");
            }

            console.log("Filtered appointment events:", filteredAppointments);
            console.log("Filtered leave events:", filteredLeaves);

            setAppointmentEvents(filteredAppointments);
            setLeaveEvents(filteredLeaves);

            const appointmentsWithClientId = filteredAppointments.filter(app => app.client_id);
            if (appointmentsWithClientId.length > 0) {
                console.log("Appointments with client_id:", appointmentsWithClientId);

                const clientIds: number[] = appointmentsWithClientId.map(app => app.client_id);
                const uniqueClientIds: number[] = Array.from(new Set(clientIds))
                    .filter(id => !clientInfoMap.has(id));

                uniqueClientIds.forEach(fetchClientInfo);
            }
        } else if (event) {
            viewingGroupRef.current = false;

            if (isAppointmentEvent(event)) {
                originalEventTypeRef.current = EVENT_TYPE.APPOINTMENT;
                console.log("Viewing single APPOINTMENT");
                setAppointmentEvents([event]);
                setLeaveEvents([]);

                if (event.client_id && !event.client) {
                    console.log("Fetching client for single appointment:", event);
                    fetchClientInfo(event.client_id);
                }
            } else if (isLeaveEvent(event)) {
                originalEventTypeRef.current = EVENT_TYPE.LEAVE;
                console.log("Viewing single LEAVE");
                setAppointmentEvents([]);
                setLeaveEvents([event]);
            }
        } else {
            viewingGroupRef.current = false;
            originalEventTypeRef.current = null;
            setAppointmentEvents([]);
            setLeaveEvents([]);
        }
    }, [event, events, fetchClientInfo, clientInfoMap]);

    // Update appointment events with client info when clientInfoMap changes
    useEffect(() => {
        console.log("Client info map updated:", Array.from(clientInfoMap.entries()));

        if (clientInfoMap.size > 0 && appointmentEvents.length > 0) {
            setAppointmentEvents(prev => {
                return prev.map(app => {
                    if (app.client_id && clientInfoMap.has(app.client_id)) {
                        return {
                            ...app,
                            client: clientInfoMap.get(app.client_id)
                        };
                    }
                    return app;
                });
            });
        }
    }, [clientInfoMap]);

    // Handle clicking delete button
    const handleDeleteClick = (selectedEvent: any) => {
        setEventToDelete(selectedEvent);
        setIsDeleteModalOpen(true);
    };

    // Handle actual deletion
    const handleDelete = async () => {
        if (!eventToDelete) return;

        setIsDeleting(true);

        await availabilityApiService.deleteAvailability(eventToDelete.id)
            .then(() => {
                if (isAppointmentEvent(eventToDelete)) {
                    setAppointmentEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
                    message.success("Appointment deleted successfully");
                } else {
                    setLeaveEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
                    message.success("Leave deleted successfully");
                }

                setIsDeleteModalOpen(false);

                if ((events && events.length <= 1) || (!events && currentEvent)) {
                    setSidebarOpen(false);
                }

                refreshAvailability();
            })
            .catch(error => {
                console.error("Error deleting event:", error);
                message.error("Failed to delete event");
            })
            .finally(() => {
                setIsDeleting(false);
                setEventToDelete(null);
            });
    };

    const handleUpdateClick = (selectedEvent: any) => {
        if (isAppointmentEvent(selectedEvent)) {
            console.log("Setting update event type to APPOINTMENT");
        } else if (isLeaveEvent(selectedEvent)) {
            console.log("Setting update event type to LEAVE");
        }

        setEventToUpdate(selectedEvent);
        setIsUpdateModalOpen(true);
    };

    const handleUpdateSuccess = async (updatedEvent?: any) => {
        setIsUpdateModalOpen(false);

        const currentViewType = localStorage.getItem('viewingEventType') || 'all';
        console.log('Current view type:', currentViewType);

        if (updatedEvent) {
            const eventType = updatedEvent.type.toLowerCase();
            console.log('Updated event type:', eventType);

            if ((currentViewType === 'appointment' && eventType === 'leave') ||
                (currentViewType === 'leave' && eventType === 'appointment')) {
                localStorage.setItem('viewingEventType', 'all');
            }
        }

        await refreshAvailability();
        message.success("Event updated successfully");
    };

    // Prepare event data for modal
    const prepareEventForModal = (selectedEvent: any) => {
        if (!selectedEvent) return null;

        const eventData: any = {
            availability_id: selectedEvent.id,
            type: selectedEvent.type,
            active: selectedEvent.active || "Y",
            status: selectedEvent.status || "Y",
            notes: selectedEvent.notes || ""
        };

        if (isAppointmentEvent(selectedEvent)) {
            eventData.client_id = selectedEvent.client_id;
            eventData.appointment_date = selectedEvent.start.toISOString().split('T')[0];
            eventData.start_time = selectedEvent.start.toTimeString().split(' ')[0];
            eventData.end_time = selectedEvent.end.toTimeString().split(' ')[0];

            if (!selectedEvent.client && selectedEvent.client_id && clientInfoMap.has(selectedEvent.client_id)) {
                eventData.client = clientInfoMap.get(selectedEvent.client_id);
            } else if (selectedEvent.client) {
                eventData.client = selectedEvent.client;
            }
        } else if (isLeaveEvent(selectedEvent)) {
            eventData.start_date = selectedEvent.start.toISOString().split('T')[0];
            eventData.end_date = selectedEvent.end.toISOString().split('T')[0];
            eventData.start_time = selectedEvent.start.toTimeString().split(' ')[0];
            eventData.end_time = selectedEvent.end.toTimeString().split(' ')[0];
        }

        return eventData;
    };

    // Render appointment item
    const renderAppointmentItem = (appointmentEvent: any) => {
        let client = appointmentEvent.client;

        if (!client && appointmentEvent.client_id && clientInfoMap.has(appointmentEvent.client_id)) {
            client = clientInfoMap.get(appointmentEvent.client_id);
        }

        return (
            <div key={appointmentEvent.id} className="border-b py-3 last:border-b-0"
                 style={{ borderColor: themeStyles.eventItem.borderColor }}>
                <div>
                    <div className="mb-2">
                        <span className="font-semibold" style={{ color: themeStyles.label.color }}>{t('client')}: </span>
                        <span className="font-medium" style={{ color: themeStyles.clientName.color }}>
                            {client ? `${client.first_name} ${client.last_name}` : t('unknown-client')}
                        </span>
                    </div>

                    <div className="mb-2 flex items-center justify-between">
                        <div>
                            <span className="font-semibold" style={{ color: themeStyles.label.color }}>{t('time')}: </span>
                            <span style={{ color: themeStyles.value.color }}>
                                {appointmentEvent.start instanceof Date ?
                                    appointmentEvent.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) :
                                    t('invalid-time')} -
                                {appointmentEvent.end instanceof Date ?
                                    appointmentEvent.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) :
                                    t('invalid-time')}
                            </span>
                        </div>
                        <div className="flex space-x-1">
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined style={{ color: themeStyles.iconEdit }} />}
                                onClick={() => handleUpdateClick(appointmentEvent)}
                                title={translateString('edit')}
                                style={{ padding: '0 4px' }}
                            />
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined style={{ color: themeStyles.iconDelete }} />}
                                onClick={() => handleDeleteClick(appointmentEvent)}
                                title={translateString('delete')}
                                style={{ padding: '0 4px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderLeaveItem = (leaveEvent: any) => {
        return (
            <div key={leaveEvent.id} className="border-b py-3 last:border-b-0"
                 style={{ borderColor: themeStyles.eventItem.borderColor }}>
                <div>


                    <div className="mb-2 flex items-center justify-between">
                        <div>
                            <span className="font-semibold" style={{ color: themeStyles.label.color }}>{t('time')}: </span>
                            <span style={{ color: themeStyles.value.color }}>
                                {leaveEvent.start instanceof Date ?
                                    leaveEvent.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) :
                                    t('invalid-time')} -
                                {leaveEvent.end instanceof Date ?
                                    leaveEvent.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) :
                                    t('invalid-time')}
                            </span>
                        </div>
                        <div className="flex space-x-1">
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined style={{ color: themeStyles.iconEdit }} />}
                                onClick={() => handleUpdateClick(leaveEvent)}
                                title={translateString('edit')}
                                style={{ padding: '0 4px' }}
                            />
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined style={{ color: themeStyles.iconDelete }} />}
                                onClick={() => handleDeleteClick(leaveEvent)}
                                title={translateString('delete')}
                                style={{ padding: '0 4px' }}
                            />
                        </div>
                    </div>

                    {leaveEvent.start instanceof Date && leaveEvent.end instanceof Date &&
                        !moment(leaveEvent.start).isSame(moment(leaveEvent.end), 'day') && (
                            <div className="mb-2">
                                <span className="font-semibold" style={{ color: themeStyles.label.color }}>{t('period')}: </span>
                                <span style={{ color: themeStyles.value.color }}>
                                    {leaveEvent.start.toLocaleDateString()} {t('to')} {leaveEvent.end.toLocaleDateString()}
                                </span>
                            </div>
                        )}
                </div>
            </div>
        );
    };

    const isAnyLoading = isLoadingClient || isLoadingAppointments || isLoadingLeaves;

    return (
        <div className="w-80 shadow-xl border-r h-full relative flex flex-col"
             style={{
                 backgroundColor: themeStyles.container.backgroundColor,
                 borderColor: themeStyles.container.borderColor,
                 color: themeStyles.container.color
             }}>
            <div className="flex-shrink-0 p-4 border-b"
                 style={{ borderColor: themeStyles.header.borderColor }}>
                <button
                    className="absolute top-4 right-4 rounded-full w-8 h-8 flex items-center justify-center shadow-sm z-10"
                    style={{
                        color: themeStyles.closeButton.color,
                        backgroundColor: themeStyles.closeButton.backgroundColor
                    }}
                    onClick={() => setSidebarOpen(false)}
                >
                    ×
                </button>

                <h2 className="text-xl font-semibold mt-8 pr-12"
                    style={{ color: themeStyles.title.color }}>
                    {events && events.length > 0 && events[0].start instanceof Date
                        ? t('events-for', { date: events[0].start.toLocaleDateString() })
                        : currentEvent && currentEvent.start instanceof Date
                            ? currentEvent.start.toLocaleDateString()
                            : selectedDate
                                ? selectedDate.toLocaleDateString()
                                : t('events')}
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4"
                 style={{
                     maxHeight: 'calc(100vh - 120px)',
                     backgroundColor: themeStyles.content.backgroundColor
                 }}>
                {isAnyLoading && (
                    <div className="flex justify-center py-4">
                        <Spin size="small" />
                    </div>
                )}

                {!isAnyLoading && (
                    <>
                        {events && events.length > 0 ? (
                            <div className="mb-4">
                                {appointmentEvents && appointmentEvents.length > 0 && (
                                    <div>
                                        <h3 className="text-md font-medium mb-4 pb-2 border-b"
                                            style={{
                                                color: themeStyles.appointmentHeader.color,
                                                borderColor: themeStyles.appointmentHeader.borderColor
                                            }}>
                                            {t('appointments')} ({appointmentEvents.length})
                                        </h3>
                                        <div className="mb-4">
                                            {appointmentEvents
                                                .sort((a, b) => {
                                                    if (a.start instanceof Date && b.start instanceof Date) {
                                                        return a.start.getTime() - b.start.getTime();
                                                    }
                                                    return 0;
                                                })
                                                .map((appointmentEvent, index) => (
                                                    <div key={`appointment-${appointmentEvent.id || index}`} className="pb-3 border-b last:border-b-0"
                                                         style={{ borderColor: themeStyles.eventItem.borderColor }}>
                                                        {renderAppointmentItem(appointmentEvent)}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                                {leaveEvents && leaveEvents.length > 0 && (
                                    <div>
                                        <h3 className="text-md font-medium mb-4 pb-2 border-b"
                                            style={{
                                                color: themeStyles.leaveHeader.color,
                                                borderColor: themeStyles.leaveHeader.borderColor
                                            }}>
                                            {t('leaves')} ({leaveEvents.length})
                                        </h3>
                                        <div className="space-y-4">
                                            {leaveEvents
                                                .sort((a, b) => {
                                                    if (a.start instanceof Date && b.start instanceof Date) {
                                                        return a.start.getTime() - b.start.getTime();
                                                    }
                                                    return 0;
                                                })
                                                .map((leaveEvent, index) => (
                                                    <div key={`leave-${leaveEvent.id || index}`} className="pb-3 border-b last:border-b-0"
                                                         style={{ borderColor: themeStyles.eventItem.borderColor }}>
                                                        {renderLeaveItem(leaveEvent)}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                                {(!appointmentEvents || appointmentEvents.length === 0) &&
                                    (!leaveEvents || leaveEvents.length === 0) && (
                                        <div className="p-4 rounded-lg"
                                             style={{
                                                 backgroundColor: themeStyles.noEvents.backgroundColor,
                                                 color: themeStyles.noEvents.color
                                             }}>
                                            <p>{t('no-events')}</p>
                                        </div>
                                    )}
                            </div>
                        ) : (
                            currentEvent ? (
                                <div>
                                    <h3 className="text-md font-medium mb-4 pb-2 border-b"
                                        style={{
                                            color: themeStyles.label.color,
                                            borderColor: themeStyles.eventItem.borderColor
                                        }}>
                                        {isAppointmentEvent(currentEvent) ? t('appointment') : t('leave')}
                                    </h3>
                                    <div className="pt-2">
                                        {isAppointmentEvent(currentEvent) ? (
                                            renderAppointmentItem(currentEvent)
                                        ) : (
                                            renderLeaveItem(currentEvent)
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg"
                                     style={{
                                         backgroundColor: themeStyles.noEvents.backgroundColor,
                                         color: themeStyles.noEvents.color
                                     }}>
                                    <p>{t('no-events')}</p>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            <Modal
                title={t('confirm-delete')}
                open={isDeleteModalOpen}
                onCancel={() => setIsDeleteModalOpen(false)}
                onOk={handleDelete}
                okText={t('delete')}
                okButtonProps={{
                    danger: true,
                    loading: isDeleting
                }}
                cancelButtonProps={{disabled: isDeleting}}
            >
                <p>{t('confirm-delete-message', { type: eventToDelete?.type })}</p>
                {eventToDelete && (
                    <div className="mt-2 p-2 rounded"
                         style={{
                             backgroundColor: themeStyles.deleteModal.backgroundColor,
                             color: themeStyles.deleteModal.color
                         }}>
                        <p><strong>{t('date')}:</strong> {eventToDelete.start instanceof Date ?
                            eventToDelete.start.toLocaleDateString() : t('unknown-date')}</p>
                        {isAppointmentEvent(eventToDelete) && eventToDelete.client_id && (
                            <p><strong>{t('client')}:</strong> {
                                eventToDelete.client
                                    ? `${eventToDelete.client.first_name} ${eventToDelete.client.last_name}`
                                    : clientInfoMap.has(eventToDelete.client_id)
                                        ? `${clientInfoMap.get(eventToDelete.client_id).first_name} ${clientInfoMap.get(eventToDelete.client_id).last_name}`
                                        : t('unknown-client')
                            }</p>
                        )}
                        <p><strong>{t('time')}:</strong> {eventToDelete.start instanceof Date ?
                            eventToDelete.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) :
                            t('unknown-time')}</p>
                    </div>
                )}
            </Modal>

            {eventToUpdate && (
                <UpdateEventModal
                    isOpen={isUpdateModalOpen}
                    onClose={() => setIsUpdateModalOpen(false)}
                    onSuccess={handleUpdateSuccess}
                    eventData={prepareEventForModal(eventToUpdate)}
                />
            )}
        </div>
    );
};

export default Sidebar;