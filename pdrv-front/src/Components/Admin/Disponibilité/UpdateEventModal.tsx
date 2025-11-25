import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Select, message, Spin, Input } from 'antd';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import availabilityApiService from '../../../util/services/AvailabilityApiService';
import usersApiService from '../../../util/services/UsersApiService';
import clientApiService from '../../../util/services/ClientsApiService';

const { Option } = Select;
const { TextArea } = Input;

interface Client {
    id: number;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    admin_id?: number;
}
interface UpdateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedEventData?: any) => void;
    eventData: any;
    currentClient?: Client;
    appointmentOnly?: boolean;
}

interface User {
    user_id: number;
    working_hours?: any;
}

const EVENT_TYPE = {
    APPOINTMENT: 'appointment',
    LEAVE: 'leave'
};

const UpdateEventModal: React.FC<UpdateEventModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               onSuccess,
                                                               eventData,
                                                               currentClient,
                                                               appointmentOnly = false,
                                                           }) => {
    const { t } = useTranslation();
    const translateString = (key: string): string => {
        const translation = t(key);
        return typeof translation === 'string' ? translation : key;
    };
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [eventType, setEventType] = useState<string>(EVENT_TYPE.APPOINTMENT);
    const [leaveType, setLeaveType] = useState<string>('days');
    const [existingEvents, setExistingEvents] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [checking, setChecking] = useState<boolean>(false);
    const [selectedClient, setSelectedClient] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [workingHours, setWorkingHours] = useState<any>(null);
    const [notes, setNotes] = useState<string>('');

    // State for react-datepicker
    const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
    const [leaveStartDate, setLeaveStartDate] = useState<Date | null>(null);
    const [leaveEndDate, setLeaveEndDate] = useState<Date | null>(null);
    const [leaveHoursDate, setLeaveHoursDate] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);

    // Helper function to normalize event type
    const normalizeEventType = (type: string): string => {
        if (!type) return EVENT_TYPE.APPOINTMENT;

        const normalizedType = String(type).toLowerCase();
        return normalizedType === EVENT_TYPE.LEAVE ? EVENT_TYPE.LEAVE : EVENT_TYPE.APPOINTMENT;
    };

    // Fetch current user ID
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

    // Fetch data when modal opens and user ID is available
    useEffect(() => {
        if (isOpen && currentUserId) {
            fetchExistingEvents();
            fetchClients();
            fetchWorkingHours();
        }
    }, [isOpen, currentUserId]);

    // Initialize form with event data when modal opens
    useEffect(() => {
        if (isOpen && eventData) {
            console.log("Initial event data:", eventData);

            // Normalize the event type
            const normalizedType = normalizeEventType(eventData.type);
            setEventType(normalizedType);
            setNotes(eventData.notes || '');

            if (normalizedType === EVENT_TYPE.APPOINTMENT) {
                // Set client
                setSelectedClient(currentClient ? currentClient.id : eventData.client_id);

                // Set date
                const date = new Date(eventData.appointment_date);
                setAppointmentDate(date);

                // Set times
                const startTimeStr = eventData.start_time;
                const endTimeStr = eventData.end_time;

                const startTimeDate = new Date(date);
                const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
                startTimeDate.setHours(startHours, startMinutes, 0);
                setStartTime(startTimeDate);

                const endTimeDate = new Date(date);
                const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
                endTimeDate.setHours(endHours, endMinutes, 0);
                setEndTime(endTimeDate);
            } else if (normalizedType === EVENT_TYPE.LEAVE) {
                const isFullDay = eventData.start_time === '00:00:00' && eventData.end_time === '23:59:59';
                const isSameDay = moment(eventData.start_date).isSame(moment(eventData.end_date), 'day');

                if (isFullDay || !isSameDay) {
                    // Days leave (full day or multiple days)
                    setLeaveType('days');

                    const startDate = new Date(eventData.start_date);
                    const endDate = new Date(eventData.end_date);

                    setLeaveStartDate(startDate);
                    setLeaveEndDate(endDate);
                } else {
                    // Hours leave
                    setLeaveType('hours');

                    const date = new Date(eventData.start_date);
                    setLeaveHoursDate(date);

                    // Set times
                    const startTimeStr = eventData.start_time;
                    const endTimeStr = eventData.end_time;

                    const startTimeDate = new Date(date);
                    const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
                    startTimeDate.setHours(startHours, startMinutes, 0);
                    setStartTime(startTimeDate);

                    const endTimeDate = new Date(date);
                    const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
                    endTimeDate.setHours(endHours, endMinutes, 0);
                    setEndTime(endTimeDate);
                }
            }
        }
    }, [isOpen, eventData, currentClient]);

    const fetchExistingEvents = async () => {
        if (!currentUserId) return;

        setChecking(true);

        // Create a properly structured filter object to pass to the service method
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
                        }
                    ]
                }
            ],
            includes: ["user", "client"],
            limit: 1000,
            offset: 0
        };

        try {
            // Call the existing service method with the structured filter params
            const response = await availabilityApiService.getAvailabilityByUser(currentUserId, filterParams);

            if (response && response.data && response.data.data) {
                const filteredEvents = response.data.data.filter((event: any) => {
                    // Log each event for debugging
                    console.log("Event being checked:", event);
                    console.log("Current event being updated:", eventData);

                    // Ensure we're comparing the correct identifier
                    const isCurrentEvent =
                        event.availability_id === eventData.availability_id ||
                        (event.id === eventData.availability_id);

                    console.log("Is current event:", isCurrentEvent);

                    // Return false for the current event, true for all others
                    return !isCurrentEvent;
                });

                console.log("Filtered events:", filteredEvents);
                setExistingEvents(filteredEvents);
            } else {
                console.log("No existing events found or invalid response format");
                setExistingEvents([]);
            }
        } catch (error) {
            console.error("Error fetching existing events:", error);
            message.error("Failed to fetch existing events");
            setExistingEvents([]);
        } finally {
            setChecking(false);
        }
    };
    const fetchClients = async () => {
        if (!currentUserId) return;

        try {
            setLoading(true);

            const filterParams = JSON.stringify({
                filter: [
                    {
                        operator: 'and',
                        conditions: [
                            {
                                field: 'admin_id',
                                operator: 'eq',
                                value: currentUserId
                            }
                        ]
                    }
                ],
                // Add phone_number to the fields you want to retrieve
                fields: ['id', 'first_name', 'last_name', 'phone_number', 'admin_id'],
                limit: 1000,
                offset: 0
            });

            const response = await clientApiService.findClients(filterParams);

            if (response && response.data && response.data.data) {
                const allClientData = response.data.data || [];
                // Apply extra filtering to ensure we only get clients with the right admin_id
                const clientData = allClientData.filter((client: Client) => client.admin_id === currentUserId);
                setClients(clientData);
                console.log("Fetched clients:", clientData);
            } else {
                console.log("No clients found or invalid response format");
                setClients([]);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkingHours = () => {
        if (!currentUserId) return;

        usersApiService.getWorkingHoursByUserId(currentUserId)
            .then(response => {
                console.log("Raw working hours response:", response.data);

                // Create default working hours
                const defaultWorkingHours = {
                    monday: { active: true, start_time: "09:00:00", end_time: "17:00:00" },
                    tuesday: { active: true, start_time: "09:00:00", end_time: "17:00:00" },
                    wednesday: { active: true, start_time: "09:00:00", end_time: "17:00:00" },
                    thursday: { active: true, start_time: "09:00:00", end_time: "17:00:00" },
                    friday: { active: true, start_time: "09:00:00", end_time: "17:00:00" },
                    saturday: { active: false, start_time: "09:00:00", end_time: "17:00:00" },
                    sunday: { active: false, start_time: "09:00:00", end_time: "17:00:00" }
                };

                // Check if response.data contains working_hours property
                if (response.data && response.data.working_hours) {
                    console.log("Found working hours in response.data.working_hours");
                    processWorkingHours(response.data.working_hours);
                    return;
                }

                // Check if the first user in the array has working_hours
                if (response.data?.data && Array.isArray(response.data.data)) {
                    const currentUserData = response.data.data.find((u: User) => u.user_id === currentUserId);

                    if (currentUserData?.working_hours) {
                        console.log("Found working hours in user object:", currentUserData.working_hours);
                        processWorkingHours(currentUserData.working_hours);
                        return;
                    }
                }

                // If no working hours data found, use defaults
                console.log("No working hours found in response, using defaults");
                setWorkingHours(defaultWorkingHours);
            })
            .catch(error => {
                console.error("Error fetching working hours:", error);
                const defaultWorkingHours = {
                    monday: { active: true, start_time: "09:00:00", end_time: "17:00:00" },
                    tuesday: { active: true, start_time: "09:00:00", end_time: "17:00:00" },
                    wednesday: { active: true, start_time: "09:00:00", end_time: "17:00:00" },
                    thursday: { active: true, start_time: "09:00:00", end_time: "17:00:00" },
                    friday: { active: true, start_time: "09:00:00", end_time: "17:00:00" },
                    saturday: { active: false, start_time: "09:00:00", end_time: "17:00:00" },
                    sunday: { active: false, start_time: "09:00:00", end_time: "17:00:00" }
                };
                setWorkingHours(defaultWorkingHours);
            });
        function processWorkingHours(workingHoursData: any) {
            const formattedWorkingHours: {[key: string]: {active: boolean|string, start_time: string, end_time: string}} = {};

            if (typeof workingHoursData === 'object' && workingHoursData !== null) {
                // Object-based structure
                for (const day in workingHoursData) {
                    const dayData = workingHoursData[day];
                    if (dayData) {
                        formattedWorkingHours[day] = {
                            active: dayData.active || dayData.is_working_day || false,
                            start_time: dayData.start_time || dayData.start || "09:00:00",
                            end_time: dayData.end_time || dayData.end || "17:00:00"
                        };
                    }
                }
            } else if (Array.isArray(workingHoursData)) {
                // Array-based structure
                const dayMapping = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                workingHoursData.forEach((item, index) => {
                    if (index < dayMapping.length) {
                        const day = dayMapping[index];
                        formattedWorkingHours[day] = {
                            active: item.active || item.is_working_day || false,
                            start_time: item.start_time || item.start || "09:00:00",
                            end_time: item.end_time || item.end || "17:00:00"
                        };
                    }
                });
            }

            // Fill in missing days with defaults
            const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
            days.forEach(day => {
                if (!formattedWorkingHours[day]) {
                    formattedWorkingHours[day] = {
                        active: day !== "saturday" && day !== "sunday",
                        start_time: "09:00:00",
                        end_time: "17:00:00"
                    };
                }
            });

            console.log("Processed working hours:", formattedWorkingHours);
            setWorkingHours(formattedWorkingHours);
        }
    };

// Modify isDateDisabled to be more permissive
    const isDateDisabled = (date: Date): boolean => {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Prevent selecting past dates
        if (date < currentDate) {
            return true;
        }

        // Check if the day is a working day
        const dayOfWeek = moment(date).format('dddd').toLowerCase();

        // Log working hours for debugging
        console.log("Day of week:", dayOfWeek);
        console.log("Working hours:", workingHours);

        // Ensure working hours exist and the day is active
        if (!workingHours ||
            !workingHours[dayOfWeek] ||
            workingHours[dayOfWeek].active === false) {
            console.log(`Day ${dayOfWeek} is not a working day`);
            return true;
        }

        const formattedDate = moment(date).format('YYYY-MM-DD');

        // Check for conflicting events
        return existingEvents.some(event => {
            // Skip the current event being updated
            if (event.availability_id === eventData.availability_id) {
                return false;
            }

            if (normalizeEventType(event.type) === EVENT_TYPE.LEAVE) {
                const eventStartDate = moment(event.start_date).format('YYYY-MM-DD');
                const eventEndDate = moment(event.end_date).format('YYYY-MM-DD');

                // Full-day leave or multi-day leave
                const isFullDayLeave =
                    (event.start_time === '00:00:00' && event.end_time === '23:59:59') ||
                    (eventStartDate !== eventEndDate);

                if (isFullDayLeave) {
                    return moment(formattedDate).isBetween(
                        eventStartDate,
                        eventEndDate,
                        null,
                        '[]'
                    );
                }
            }

            return false;
        });
    };

    const filterTime = (time: Date, selectedDate: Date | null, isStartTime = true) => {
        if (!selectedDate) return true;

        const dayOfWeek = moment(selectedDate).format('dddd').toLowerCase();

        // Log working hours for debugging
        console.log("Filtering time - Day of week:", dayOfWeek);
        console.log("Working hours:", workingHours);

        // If no working hours or day is not active, allow all times
        if (!workingHours ||
            !workingHours[dayOfWeek] ||
            workingHours[dayOfWeek].active === false) {
            console.log(`Allowing all times for ${dayOfWeek}`);
            return true;
        }

        const timeValue = moment(time).format('HH:mm:ss');
        const workStart = workingHours[dayOfWeek].start_time;
        const workEnd = workingHours[dayOfWeek].end_time;

        console.log("Work start:", workStart);
        console.log("Work end:", workEnd);
        console.log("Current time:", timeValue);

        // Ensure time is within working hours
        if (!(timeValue >= workStart && timeValue <= workEnd)) {
            console.log("Time outside working hours");
            return false;
        }

        if (!isStartTime && startTime) {
            if (time <= startTime) {
                console.log("End time before start time");
                return false;
            }
        }

        const formattedDate = moment(selectedDate).format('YYYY-MM-DD');

        return !existingEvents.some(event => {
            if (event.availability_id === eventData.availability_id) {
                return false;
            }

            if (normalizeEventType(event.type) === EVENT_TYPE.APPOINTMENT) {
                const eventDate = moment(event.appointment_date).format('YYYY-MM-DD');
                if (eventDate !== formattedDate) return false;

                const eventStartTime = moment(event.start_time, 'HH:mm:ss').toDate();
                const eventEndTime = moment(event.end_time, 'HH:mm:ss').toDate();

                return (
                    moment(time).isSame(eventStartTime) ||
                    moment(time).isSame(eventEndTime) ||
                    (time > eventStartTime && time < eventEndTime)
                );
            }

            if (normalizeEventType(event.type) === EVENT_TYPE.LEAVE) {
                const eventStartDate = moment(event.start_date).format('YYYY-MM-DD');
                const eventEndDate = moment(event.end_date).format('YYYY-MM-DD');

                // Check if the date is within the leave period
                const isDateInLeavePeriod = moment(formattedDate).isBetween(
                    eventStartDate,
                    eventEndDate,
                    null,
                    '[]'
                );

                if (isDateInLeavePeriod &&
                    (event.start_time === '00:00:00' && event.end_time === '23:59:59')) {
                    return true;
                }

                if (isDateInLeavePeriod && formattedDate === eventStartDate) {
                    const eventStartTime = moment(event.start_time, 'HH:mm:ss').toDate();
                    const eventEndTime = moment(event.end_time, 'HH:mm:ss').toDate();

                    return (
                        moment(time).isSame(eventStartTime) ||
                        moment(time).isSame(eventEndTime) ||
                        (time > eventStartTime && time < eventEndTime)
                    );
                }

                return false;
            }

            return false;
        });
    };

    const handleTypeChange = (value: string) => {
        setEventType(normalizeEventType(value));
        if (value === EVENT_TYPE.LEAVE) {
            setLeaveType('days');
        }
    };

    const handleLeaveTypeChange = (value: string) => {
        setLeaveType(value);
    };

    const handleClientChange = (clientId: number | null) => {
        setSelectedClient(clientId);
    };

    // Handle notes change
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!currentUserId) {
            message.error(t('no-user-id'));
            return;
        }

        setLoading(true);

        // Common fields for updating availability
        const updateData: any = {
            id: eventData.availability_id,
            user_id: currentUserId,
            type: eventType,
            active: eventData.active || "Y",
            status: eventData.status || "Y",
            notes: notes
        };

        try {
            if (eventType === EVENT_TYPE.APPOINTMENT) {
                // Appointment update logic
                if (!appointmentDate || !startTime || !endTime) {
                    message.error(t('fill-required-fields'));
                    setLoading(false);
                    return;
                }

                if (!selectedClient) {
                    message.error(t('select-client-error'));
                    setLoading(false);
                    return;
                }

                const date = moment(appointmentDate).format("YYYY-MM-DD");
                const startTimeStr = moment(startTime).format("HH:mm:ss");
                const endTimeStr = moment(endTime).format("HH:mm:ss");

                // Conflict checking
                if (isTimeBooked(appointmentDate, startTime, endTime)) {
                    message.error(t('time-slot-booked'));
                    setLoading(false);
                    return;
                }

                // Set appointment-specific fields
                updateData.client_id = selectedClient;
                updateData.appointment_date = date;
                updateData.start_date = date;
                updateData.end_date = date;
                updateData.start_time = startTimeStr;
                updateData.end_time = endTimeStr;
            } else if (eventType === EVENT_TYPE.LEAVE) {
                // Leave event update logic
                if (leaveType === 'days') {
                    if (!leaveStartDate || !leaveEndDate) {
                        message.error(t('select-leave-dates'));
                        setLoading(false);
                        return;
                    }

                    const startDate = moment(leaveStartDate).format("YYYY-MM-DD");
                    const endDate = moment(leaveEndDate).format("YYYY-MM-DD");

                    // Check for conflicts with existing events
                    let hasConflict = false;
                    const currentDate = moment(leaveStartDate);

                    while (currentDate.isSameOrBefore(moment(leaveEndDate), 'day')) {
                        const dateStr = currentDate.format('YYYY-MM-DD');

                        const hasAppointments = existingEvents.some(event => {
                            if (normalizeEventType(event.type) === EVENT_TYPE.APPOINTMENT) {
                                const eventDate = moment(event.appointment_date || event.start_date).format('YYYY-MM-DD');
                                return eventDate === dateStr;
                            }
                            return false;
                        });

                        if (hasAppointments) {
                            hasConflict = true;
                            break;
                        }

                        currentDate.add(1, 'day');
                    }

                    if (hasConflict) {
                        message.error(t('leave-conflict'));
                        setLoading(false);
                        return;
                    }

                    // Set full-day leave fields
                    updateData.start_date = startDate;
                    updateData.end_date = endDate;
                    updateData.start_time = "00:00:00";
                    updateData.end_time = "23:59:59";
                } else if (leaveType === 'hours') {
                    if (!leaveHoursDate || !startTime || !endTime) {
                        message.error(t('hours-leave-required'));
                        setLoading(false);
                        return;
                    }

                    const date = moment(leaveHoursDate).format("YYYY-MM-DD");
                    const startTimeStr = moment(startTime).format("HH:mm:ss");
                    const endTimeStr = moment(endTime).format("HH:mm:ss");

                    // Check for conflicts with existing events
                    if (isTimeBooked(leaveHoursDate, startTime, endTime)) {
                        message.error(t('time-slot-booked'));
                        setLoading(false);
                        return;
                    }

                    // Set hours leave fields
                    updateData.start_date = date;
                    updateData.end_date = date;
                    updateData.start_time = startTimeStr;
                    updateData.end_time = endTimeStr;
                }
            }

            // Update availability
            const response = await availabilityApiService.updateAvailability(updateData);

            if (response.data && (response.data.success || response.data.status === 1)) {
                // Close the modal
                onClose();

                // Pass the updated data back to the parent component
                setTimeout(() => {
                    // Ensure we're passing the correctly normalized event type
                    updateData.type = normalizeEventType(updateData.type);

                    // Pass the updated data to onSuccess
                    onSuccess(updateData);
                    message.success( t('update-success', {
                        type: eventType === EVENT_TYPE.APPOINTMENT
                            ? t('appointment')
                            : t('leave')
                    }));
                }, 300);
            } else {
                // Error handling
                message.error(  t('update-failed', {
                    message: response.data?.message || t('unknown-error')
                }));
            }
        } catch (error: any) {
            console.error("Error updating event:", error);
            message.error( t('update-failed', {
                message: error.message || t('network-error')
            }));
        } finally {
            setLoading(false);
        }
    };

    // Check for time booking conflicts
    const isTimeBooked = (date: Date, proposedStartTime: Date, proposedEndTime: Date): boolean => {
        const formattedDate = moment(date).format('YYYY-MM-DD');
        const formattedStartTime = moment(proposedStartTime).format('HH:mm:ss');
        const formattedEndTime = moment(proposedEndTime).format('HH:mm:ss');

        return existingEvents.some(event => {
            const eventTypeToCheck = eventType === EVENT_TYPE.APPOINTMENT
                ? [EVENT_TYPE.APPOINTMENT, EVENT_TYPE.LEAVE]
                : [EVENT_TYPE.APPOINTMENT];

            const currentEventType = normalizeEventType(event.type);

            if (!eventTypeToCheck.includes(currentEventType)) {
                return false;
            }

            if (currentEventType === EVENT_TYPE.APPOINTMENT) {
                const eventDate = moment(event.appointment_date || event.start_date).format('YYYY-MM-DD');
                if (eventDate !== formattedDate) return false;

                const eventStart = moment(event.start_time, 'HH:mm:ss');
                const eventEnd = moment(event.end_time, 'HH:mm:ss');
                const newStart = moment(formattedStartTime, 'HH:mm:ss');
                const newEnd = moment(formattedEndTime, 'HH:mm:ss');

                if (newStart.isSame(eventStart) || newStart.isSame(eventEnd) ||
                    newEnd.isSame(eventStart) || newEnd.isSame(eventEnd)) {
                    return true;
                }

                return (
                    (newStart.isAfter(eventStart) && newStart.isBefore(eventEnd)) || // Start inside existing
                    (newEnd.isAfter(eventStart) && newEnd.isBefore(eventEnd)) ||     // End inside existing
                    (newStart.isBefore(eventStart) && newEnd.isAfter(eventEnd))      // New event surrounds existing
                );
            }

            if (currentEventType === EVENT_TYPE.LEAVE) {
                const eventStartDate = moment(event.start_date).format('YYYY-MM-DD');
                const eventEndDate = moment(event.end_date).format('YYYY-MM-DD');

                if (!moment(formattedDate).isBetween(eventStartDate, eventEndDate, null, '[]')) {
                    return false;
                }

                const isFullDayLeave =
                    (event.start_time === '00:00:00' && event.end_time === '23:59:59') ||
                    (eventStartDate !== eventEndDate);

                if (isFullDayLeave) {
                    return true;
                }

                const eventStart = moment(event.start_time, 'HH:mm:ss');
                const eventEnd = moment(event.end_time, 'HH:mm:ss');
                const newStart = moment(formattedStartTime, 'HH:mm:ss');
                const newEnd = moment(formattedEndTime, 'HH:mm:ss');

                return (
                    (newStart.isSame(eventStart) || newStart.isSame(eventEnd)) ||
                    (newEnd.isSame(eventStart) || newEnd.isSame(eventEnd)) ||
                    (newStart.isAfter(eventStart) && newStart.isBefore(eventEnd)) ||
                    (newEnd.isAfter(eventStart) && newEnd.isBefore(eventEnd)) ||
                    (newStart.isBefore(eventStart) && newEnd.isAfter(eventEnd))
                );
            }

            return false;
        });
    };

    // Determine modal title based on event type
    const getModalTitle = () => {
        return eventType === EVENT_TYPE.APPOINTMENT
            ? t('update-appointment')
            : t('update-leave');
    };



    // Determine if save button should be disabled
    const isSaveDisabled = () => {
        if (!currentUserId || checking || isLoading) return true;
        if (eventType === EVENT_TYPE.APPOINTMENT) return !selectedClient;
        return false;
    };

    return (
        <Modal
            title={getModalTitle()}
            open={isOpen}
            onCancel={onClose}
            footer={[
                <Button key="back" onClick={onClose}>
                    {t('cancel')}
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={handleSubmit}
                    disabled={isSaveDisabled()}
                >
                    {t('update')} {eventType === EVENT_TYPE.APPOINTMENT ? t('appointment') : t('leave')}
                </Button>,
            ]}
            width={400}
            className="event-modal"
            destroyOnClose={true}
        >
            {checking || isLoading ? (
                <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                    <Spin /> {t('loading-data')}
                </div>
            ) : (
                <Form layout="vertical">
                    {/* Only show event type selection if appointmentOnly is false */}
                    {!appointmentOnly && (
                        <Form.Item
                            label={t('event-type')}
                            required
                        >
                            <Select
                                value={eventType}
                                onChange={handleTypeChange}
                            >
                                <Option value={EVENT_TYPE.APPOINTMENT}>{t('appointment')}</Option>
                                <Option value={EVENT_TYPE.LEAVE}>{t('leave')}</Option>
                            </Select>
                        </Form.Item>
                    )}

                    {eventType === EVENT_TYPE.LEAVE && !appointmentOnly &&  (
                        <Form.Item
                            label={t('leave-type')}
                            required
                        >
                            <Select
                                value={leaveType}
                                onChange={handleLeaveTypeChange}
                            >
                                <Option value="days">{t('days-leave')}</Option>
                                <Option value="hours">{t('hours-leave')}</Option>
                            </Select>
                        </Form.Item>
                    )}

                    {eventType === EVENT_TYPE.APPOINTMENT && (
                        <>
                            {currentClient ? (
                                <Form.Item label={t('client')}>
                                    <div className="ant-select-selection-item disabled-select">
                                        <strong>{currentClient.first_name} {currentClient.last_name}</strong>
                                    </div>
                                </Form.Item>
                            ) : (
                                <Form.Item
                                    label={t('select-client')}
                                    required
                                >
                                    <Select
                                        showSearch
                                        value={selectedClient}
                                        onChange={handleClientChange}
                                        placeholder={t('search-client-name-phone')}
                                        loading={loading}
                                        allowClear={true} // Add this to allow clearing selection
                                        filterOption={(input, option) => {
                                            if (!option || !option.value) return false;

                                            const clientId = option.value;
                                            const client = clients.find(c => c.id === clientId);

                                            if (!client) return false;

                                            const searchText = input.toLowerCase().trim();

                                            const firstName = (client.first_name || '').toLowerCase();
                                            const lastName = (client.last_name || '').toLowerCase();
                                            const phoneNumber = (client.phone_number || '').replace(/\D/g, ''); // Remove non-digits for phone search
                                            const searchNumbers = searchText.replace(/\D/g, ''); // Remove non-digits from search

                                            const nameMatch = firstName.includes(searchText) ||
                                                lastName.includes(searchText) ||
                                                `${firstName} ${lastName}`.includes(searchText);

                                            const phoneMatch = searchNumbers.length > 0 && phoneNumber.includes(searchNumbers);

                                            return nameMatch || phoneMatch;
                                        }}
                                        filterSort={(optionA, optionB) => {
                                            const clientA = clients.find(c => c.id === optionA.value);
                                            const clientB = clients.find(c => c.id === optionB.value);

                                            if (!clientA || !clientB) return 0;

                                            const nameA = `${clientA.first_name || ''} ${clientA.last_name || ''}`.toLowerCase().trim();
                                            const nameB = `${clientB.first_name || ''} ${clientB.last_name || ''}`.toLowerCase().trim();

                                            return nameA.localeCompare(nameB);
                                        }}
                                        notFoundContent={loading ? <Spin size="small" /> : t('no-clients-found')}
                                    >
                                        {clients.length > 0 ? (
                                            clients.map(client => {
                                                const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim();

                                                return (
                                                    <Option
                                                        key={client.id || `client-${Math.random()}`}
                                                        value={client.id}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '500' }}>{fullName}</span>
                                                            {client.phone_number && (
                                                                <span style={{
                                                                    color: '#666',
                                                                    fontSize: '0.9em',
                                                                    marginLeft: '8px'
                                                                }}>
                                        {client.phone_number}
                                    </span>
                                                            )}
                                                        </div>
                                                    </Option>
                                                );
                                            })
                                        ) : (
                                            <Option key="no-clients" disabled>
                                                {t('no-clients-available')}
                                            </Option>
                                        )}
                                    </Select>
                                </Form.Item>
                            )}

                            <Form.Item
                                label={t('appointment-date')}
                                required
                                help={t('appointment-date-help')}
                            >
                                <div className="ant-picker-wrapper">
                                    <DatePicker
                                        selected={appointmentDate}
                                        onChange={(date: Date | null) => setAppointmentDate(date)}
                                        filterDate={(date: Date) => !isDateDisabled(date)}
                                        dateFormat="MMMM d, yyyy"
                                        className="ant-picker"
                                        placeholderText={translateString('select-date')}
                                        minDate={new Date()}
                                    />
                                </div>
                            </Form.Item>

                            <Form.Item
                                label={t('appointment-time')}
                                required
                            >
                                <div className="time-picker-container" style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="time-label">{t('start-time')}</label>
                                        <DatePicker
                                            selected={startTime}
                                            onChange={(time: Date | null) => time && setStartTime(time)}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={1}
                                            timeCaption={translateString('start-time')}
                                            dateFormat="h:mm aa"
                                            className="ant-picker"
                                            filterTime={(time: Date) => filterTime(time, appointmentDate, true)}
                                            minTime={new Date(0, 0, 0, 0, 0)}
                                            maxTime={new Date(0, 0, 0, 23, 59)}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="time-label">{t('end-time')}</label>
                                        <DatePicker
                                            selected={endTime}
                                            onChange={(time: Date | null) => time && setEndTime(time)}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={1}
                                            timeCaption={translateString('end-time')}
                                            dateFormat="h:mm aa"
                                            className="ant-picker"
                                            filterTime={(time: Date) => filterTime(time, appointmentDate, false)}
                                            minTime={startTime || new Date(0, 0, 0, 0, 0)}
                                            maxTime={new Date(0, 0, 0, 23, 59)}
                                        />
                                    </div>
                                </div>
                            </Form.Item>
                        </>
                    )}

                    {eventType === EVENT_TYPE.LEAVE && leaveType === 'days' && (
                        <Form.Item
                            label={t('leave-date-range')}
                            required
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div>
                                    <label className="date-label">{t('start-date')}</label>
                                    <DatePicker
                                        selected={leaveStartDate}
                                        onChange={(date: Date | null) => {
                                            if (date) {
                                                setLeaveStartDate(date);
                                                if (leaveEndDate && date > leaveEndDate) {
                                                    setLeaveEndDate(date);
                                                }
                                            }
                                        }}
                                        selectsStart
                                        startDate={leaveStartDate}
                                        endDate={leaveEndDate}
                                        dateFormat="MMMM d, yyyy"
                                        className="ant-picker"
                                        minDate={new Date()}
                                        filterDate={(date: Date) => !isDateDisabled(date)}
                                    />
                                </div>
                                <div>
                                    <label className="date-label">{t('end-date')}</label>
                                    <DatePicker
                                        selected={leaveEndDate}
                                        onChange={(date: Date | null) => date && setLeaveEndDate(date)}
                                        selectsEnd
                                        startDate={leaveStartDate}
                                        endDate={leaveEndDate}
                                        minDate={leaveStartDate || undefined}
                                        dateFormat="MMMM d, yyyy"
                                        className="ant-picker"
                                        filterDate={(date: Date) => !isDateDisabled(date)}
                                    />
                                </div>
                            </div>
                        </Form.Item>
                    )}

                    {eventType === EVENT_TYPE.LEAVE && leaveType === 'hours' && (
                        <>
                            <Form.Item
                                label={t('leave-date')}
                                required
                            >
                                <div className="ant-picker-wrapper">
                                    <DatePicker
                                        selected={leaveHoursDate}
                                        onChange={(date: Date | null) => date && setLeaveHoursDate(date)}
                                        filterDate={(date: Date) => !isDateDisabled(date)}
                                        dateFormat="MMMM d, yyyy"
                                        className="ant-picker"
                                        placeholderText={translateString('select-date')}
                                        minDate={new Date()}
                                    />
                                </div>
                            </Form.Item>

                            <Form.Item
                                label={t('leave-hours')}
                                required
                            >
                                <div className="time-picker-container" style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="time-label">{t('start-time')}</label>
                                        <DatePicker
                                            selected={startTime}
                                            onChange={(time: Date | null) => time && setStartTime(time)}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={1}
                                            timeCaption={translateString('start-time')}
                                            dateFormat="h:mm aa"
                                            className="ant-picker"
                                            filterTime={(time: Date) => filterTime(time, leaveHoursDate, true)}
                                            minTime={new Date(0, 0, 0, 0, 0)}
                                            maxTime={new Date(0, 0, 0, 23, 59)}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="time-label">{t('end-time')}</label>
                                        <DatePicker
                                            selected={endTime}
                                            onChange={(time: Date | null) => time && setEndTime(time)}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={1}
                                            timeCaption={translateString('end-time')}
                                            dateFormat="h:mm aa"
                                            className="ant-picker"
                                            filterTime={(time: Date) => filterTime(time, leaveHoursDate, false)}
                                            minTime={startTime || new Date(0, 0, 0, 0, 0)}
                                            maxTime={new Date(0, 0, 0, 23, 59)}
                                        />
                                    </div>
                                </div>
                            </Form.Item>
                        </>
                    )}

                    {/* Notes field - available for both appointment and leave types */}
                    <Form.Item
                        label={t('notes')}
                        help={t('notes-help')}
                    >
                        <TextArea
                            value={notes}
                            onChange={handleNotesChange}
                            placeholder={translateString('notes-placeholder')}
                            autoSize={{ minRows: 3, maxRows: 6 }}
                        />
                    </Form.Item>
                </Form>
            )}
        </Modal>
    );
};

export default UpdateEventModal;