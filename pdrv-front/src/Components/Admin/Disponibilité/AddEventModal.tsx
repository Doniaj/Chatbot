import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form, Select, message, Spin, Radio, Input } from 'antd';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import availabilityApiService from '../../../util/services/AvailabilityApiService';
import usersApiService from '../../../util/services/UsersApiService';
import clientApiService from '../../../util/services/ClientsApiService';

const { Option } = Select;
const { TextArea } = Input;

// Define interfaces for better type safety
interface User {
    user_id: number;
    working_hours?: any;
}

interface Client {
    id: number;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    admin_id?: number;
}

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate: Date | null;
    currentClient?: Client;
    appointmentOnly?: boolean;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
                                                         isOpen,
                                                         onClose,
                                                         onSuccess,
                                                         selectedDate,
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
    const [eventType, setEventType] = useState<string>('appointment');
    const [leaveType, setLeaveType] = useState<string>('days');
    const [existingEvents, setExistingEvents] = useState<any[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [checking, setChecking] = useState<boolean>(false);
    const [selectedClient, setSelectedClient] = useState<number | null>(currentClient ? currentClient.id : null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [workingHours, setWorkingHours] = useState<any>(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

    const [appointmentDate, setAppointmentDate] = useState<Date | null>(selectedDate);
    const [leaveStartDate, setLeaveStartDate] = useState<Date | null>(selectedDate);
    const [leaveEndDate, setLeaveEndDate] = useState<Date | null>(selectedDate);
    const [leaveHoursDate, setLeaveHoursDate] = useState<Date | null>(selectedDate);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);

    useEffect(() => {
        // Get current user ID first
        setIsLoading(true);
        usersApiService.getCurrentUser()
            .then(response => {
                if (response.data && response.data.user) {
                    const userId = response.data.user.user_id;
                    setCurrentUserId(userId);
                    console.log("Current user ID:", userId);
                } else {
                    console.error("No user data found in response:", response);
                }
            })
            .catch(error => {
                console.error("Error fetching current user:", error);
                message.error("Failed to fetch user information");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (isOpen && currentUserId) {
            fetchExistingEvents();
            if (!currentClient) {
                fetchClients();
            } else {
                setClients([currentClient]);
            }
            fetchWorkingHours();
        }
    }, [isOpen, currentUserId, currentClient]);

    useEffect(() => {
        if (workingHours && selectedDate) {
            const dayOfWeek = moment(selectedDate).format('dddd').toLowerCase();
            const dayWorkingHours = workingHours[dayOfWeek];

            if (dayWorkingHours && dayWorkingHours.active) {
                const defaultStartTime = new Date(selectedDate);
                const [startHours, startMinutes] = dayWorkingHours.start_time.split(':').map(Number);
                defaultStartTime.setHours(startHours, startMinutes, 0);
                setStartTime(defaultStartTime);

                const defaultEndTime = new Date(selectedDate);
                const [endHours, endMinutes] = dayWorkingHours.end_time.split(':').map(Number);
                defaultEndTime.setHours(endHours, endMinutes, 0);
                setEndTime(defaultEndTime);
            }
        }
    }, [workingHours, selectedDate]);

    useEffect(() => {
        if (isOpen) {
            if (!currentClient) {
                setSelectedClient(null);
            }
        } else {
            setSelectedClient(currentClient ? currentClient.id : null);
        }
    }, [isOpen, currentClient]);
    useEffect(() => {
        if (isOpen && selectedDate) {
            setAppointmentDate(selectedDate);
            setLeaveStartDate(selectedDate);
            setLeaveEndDate(selectedDate);
            setLeaveHoursDate(selectedDate);

            const defaultStartTime = new Date(selectedDate);
            defaultStartTime.setHours(9, 0, 0);
            setStartTime(defaultStartTime);

            const defaultEndTime = new Date(selectedDate);
            defaultEndTime.setHours(9, 30, 0);
            setEndTime(defaultEndTime);

            setEventType('appointment');
        }

        if (appointmentOnly) {
            setEventType('appointment');
        }
    }, [isOpen, selectedDate, appointmentOnly]);

    const fetchExistingEvents = () => {
        if (!currentUserId) return;

        setChecking(true);
        availabilityApiService.getAvailabilityByUser(currentUserId)
            .then(response => {
                if (response && response.data && response.data.data) {
                    const events = response.data.data;
                    setExistingEvents(events);
                    console.log("Fetched events:", events);
                } else {
                    console.log("No existing events found or invalid response format");
                    setExistingEvents([]);
                }
            })
            .catch(error => {
                console.error("Error fetching existing events:", error);
                setExistingEvents([]);
            })
            .finally(() => {
                setChecking(false);
            });
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

    const isDateDisabled = (date: Date): boolean => {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        if (date < currentDate) {
            return true;
        }

        const dayOfWeek = moment(date).format('dddd').toLowerCase();
        if (!workingHours || !workingHours[dayOfWeek] || !workingHours[dayOfWeek].active) {
            return true;
        }

        const formattedDate = moment(date).format('YYYY-MM-DD');
        return existingEvents.some(event => {
            if (event.type === 'leave') {
                const eventStartDate = moment(event.start_date).format('YYYY-MM-DD');
                const eventEndDate = moment(event.end_date).format('YYYY-MM-DD');

                const isFullDayLeave =
                    (event.start_time === '00:00:00' && event.end_time === '23:59:59') ||
                    (eventStartDate !== eventEndDate);

                if (isFullDayLeave) {
                    return moment(formattedDate).isBetween(eventStartDate, eventEndDate, null, '[]');
                }
            }
            return false;
        });
    };

    const isTimeBooked = (date: Date, proposedStartTime: Date, proposedEndTime: Date): boolean => {
        const formattedDate = moment(date).format('YYYY-MM-DD');
        const formattedStartTime = moment(proposedStartTime).format('HH:mm:ss');
        const formattedEndTime = moment(proposedEndTime).format('HH:mm:ss');

        return existingEvents.some(event => {
            const eventTypeToCheck = eventType === 'appointment' ? ['appointment', 'leave'] : ['appointment'];

            if (!eventTypeToCheck.includes(event.type)) {
                return false;
            }

            if (event.type === 'appointment') {
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

            if (event.type === 'leave') {
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

    const filterTime = (time: Date, selectedDate: Date | null, isStartTime = true) => {
        if (!selectedDate) return false;

        const dayOfWeek = moment(selectedDate).format('dddd').toLowerCase();

        if (!workingHours || !workingHours[dayOfWeek] || !workingHours[dayOfWeek].active) {
            return false;
        }

        const timeValue = moment(time).format('HH:mm:ss');
        const workStart = workingHours[dayOfWeek].start_time;
        const workEnd = workingHours[dayOfWeek].end_time;

        if (!(timeValue >= workStart && timeValue <= workEnd)) {
            return false;
        }

        if (!isStartTime && startTime) {
            if (time <= startTime) {
                return false;
            }
        }

        const formattedDate = moment(selectedDate).format('YYYY-MM-DD');

        return !existingEvents.some(event => {
            if (event.type === 'appointment') {
                const eventDate = moment(event.appointment_date || event.start_date).format('YYYY-MM-DD');
                if (eventDate !== formattedDate) return false;

                const eventStart = moment(event.start_time, 'HH:mm:ss');
                const eventEnd = moment(event.end_time, 'HH:mm:ss');
                const selectedTime = moment(timeValue, 'HH:mm:ss');

                if (isStartTime) {

                    if (endTime) {
                        const currentEndTime = moment(endTime).format('HH:mm:ss');
                        const proposedEnd = moment(currentEndTime, 'HH:mm:ss');

                        return !(selectedTime.isSameOrAfter(eventEnd) || proposedEnd.isSameOrBefore(eventStart));
                    } else {
                        return selectedTime.isSameOrAfter(eventStart) && selectedTime.isBefore(eventEnd);
                    }
                } else {
                    if (startTime) {
                        const currentStartTime = moment(startTime).format('HH:mm:ss');
                        const proposedStart = moment(currentStartTime, 'HH:mm:ss');

                        return !(proposedStart.isSameOrAfter(eventEnd) || selectedTime.isSameOrBefore(eventStart));
                    } else {
                        return selectedTime.isAfter(eventStart) && selectedTime.isSameOrBefore(eventEnd);
                    }
                }
            }

            if (event.type === 'leave' && eventType === 'appointment') {
                const eventStartDate = moment(event.start_date).format('YYYY-MM-DD');
                const eventEndDate = moment(event.end_date).format('YYYY-MM-DD');

                if (!(moment(formattedDate).isBetween(eventStartDate, eventEndDate, null, '[]'))) {
                    return false;
                }

                // Full day leave blocks all times
                if (event.start_time === '00:00:00' && event.end_time === '23:59:59') {
                    return true;
                }

                const eventStart = moment(event.start_time, 'HH:mm:ss');
                const eventEnd = moment(event.end_time, 'HH:mm:ss');
                const selectedTime = moment(timeValue, 'HH:mm:ss');

                if (isStartTime) {
                    if (endTime) {
                        const currentEndTime = moment(endTime).format('HH:mm:ss');
                        const proposedEnd = moment(currentEndTime, 'HH:mm:ss');
                        return !(selectedTime.isSameOrAfter(eventEnd) || proposedEnd.isSameOrBefore(eventStart));
                    } else {
                        return selectedTime.isSameOrAfter(eventStart) && selectedTime.isBefore(eventEnd);
                    }
                } else {
                    if (startTime) {
                        const currentStartTime = moment(startTime).format('HH:mm:ss');
                        const proposedStart = moment(currentStartTime, 'HH:mm:ss');
                        return !(proposedStart.isSameOrAfter(eventEnd) || selectedTime.isSameOrBefore(eventStart));
                    } else {
                        return selectedTime.isAfter(eventStart) && selectedTime.isSameOrBefore(eventEnd);
                    }
                }
            }

            return false;
        });
    };


    const handleClientChange = (clientId: number | null) => {
        setSelectedClient(clientId);
    };

    const handleTypeChange = (value: string) => {
        setEventType(value);
        if (value === 'leave') {
            setLeaveType('days');
        }
    };

    const handleLeaveTypeChange = (value: string) => {
        setLeaveType(value);
    };

    const handleSubmit = () => {
        if (!currentUserId) {
            message.error(t('no-user-id'));
            return;
        }

        setLoading(true);

        const newAvailability: any = {
            user_id: currentUserId,
            type: eventType,
            active: "Y",
            status: "Y",
        };

        try {
            if (eventType === 'appointment') {
                if (!appointmentDate || !startTime || !endTime) {
                    message.error(t('fill-required-fields'));
                    setLoading(false);
                    return;
                }

                if (!selectedClient && !currentClient) {
                    message.error(t('select-client-error'));
                    setLoading(false);
                    return;
                }

                const date = moment(appointmentDate).format("YYYY-MM-DD");
                const startTimeStr = moment(startTime).format("HH:mm:ss");
                const endTimeStr = moment(endTime).format("HH:mm:ss");

                newAvailability.client_id = currentClient ? currentClient.id : selectedClient;
                newAvailability.appointment_date = date;
                newAvailability.start_date = date;
                newAvailability.end_date = date;
                newAvailability.start_time = startTimeStr;
                newAvailability.end_time = endTimeStr;

                // Add notes field if needed
                if (form.getFieldValue('notes')) {
                    newAvailability.notes = form.getFieldValue('notes');
                }
            }
            else if (eventType === 'leave') {
                if (leaveType === 'days') {
                    if (!leaveStartDate || !leaveEndDate) {
                        message.error(t('select-leave-dates'));
                        setLoading(false);
                        return;
                    }

                    newAvailability.start_date = moment(leaveStartDate).format("YYYY-MM-DD");
                    newAvailability.end_date = moment(leaveEndDate).format("YYYY-MM-DD");
                    newAvailability.start_time = "00:00:00";
                    newAvailability.end_time = "23:59:59";
                } else {
                    if (!leaveHoursDate || !startTime || !endTime) {
                        message.error(t('hours-leave-required'));
                        setLoading(false);
                        return;
                    }

                    const date = moment(leaveHoursDate).format("YYYY-MM-DD");
                    const startTimeStr = moment(startTime).format("HH:mm:ss");
                    const endTimeStr = moment(endTime).format("HH:mm:ss");

                    newAvailability.start_date = date;
                    newAvailability.end_date = date;
                    newAvailability.start_time = startTimeStr;
                    newAvailability.end_time = endTimeStr;
                }

                if (form.getFieldValue('notes')) {
                    newAvailability.notes = form.getFieldValue('notes');
                }
            }

            availabilityApiService.saveAvailability(newAvailability)
                .then(response => {
                    if (response.data && (response.data.status === 1 || response.data.success)) {
                        onClose();

                        setTimeout(() => {
                            onSuccess();
                            message.success(
                                t('event-added-success', {
                                    type: eventType === 'appointment'
                                        ? t('appointment')
                                        : t('leave')
                                })
                            );
                        }, 300);
                    } else {
                        // Use translation with interpolation for error
                        message.error(
                            t('event-add-failed', {
                                type: eventType === 'appointment'
                                    ? t('appointment')
                                    : t('leave'),
                                message: response.data?.message || t('unknown-error')
                            })
                        );
                    }
                })
                .catch(error => {
                    console.error("Error saving event:", error);
                    message.error(
                        t('event-add-failed', {
                            type: eventType === 'appointment'
                                ? t('appointment')
                                : t('leave'),
                            message: error.message || t('network-error')
                        })
                    );
                })
                .finally(() => {
                    setLoading(false);
                });
        } catch (error: any) {
            console.error("Unexpected error:", error);
            message.error(t('event-add-failed', {
                type: eventType === 'appointment'
                    ? t('appointment')
                    : t('leave'),
                message: error.message || t('unknown-error')
            }));
            setLoading(false);
        }
    };

    const isSaveDisabled = () => {
        if (!currentUserId || checking || isLoading) return true;
        if (eventType === 'appointment' && !currentClient) return !selectedClient;
        return false;
    };

    return (
        <Modal
            title={t(eventType === 'appointment' ? 'add-appointment' : 'add-leave')}
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
                    disabled={!currentUserId || checking || isLoading || (eventType === 'appointment' && !currentClient && !selectedClient)}
                >
                    {t('save')} {t(eventType === 'appointment' ? 'appointment' : 'leave')}
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
                    {!appointmentOnly && (
                        <Form.Item
                            label={t('event-type')}
                            required
                        >
                            <Select
                                value={eventType}
                                onChange={handleTypeChange}
                            >
                                <Option value="appointment">{t('appointment')}</Option>
                                <Option value="leave">{t('leave')}</Option>
                            </Select>
                        </Form.Item>
                    )}

                    {eventType === 'leave' && !appointmentOnly && (
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

                    {eventType === 'appointment' && currentClient && (
                        <Form.Item label="Client">
                            <div className="ant-select-selection-item disabled-select">
                                <strong>{currentClient.first_name} {currentClient.last_name}</strong>
                            </div>
                        </Form.Item>
                    )}

                    {eventType === 'appointment' && !currentClient && (
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


                    {eventType === 'appointment' && (
                        <>
                            <Form.Item
                                label={t('appointment-date')}
                                required
                                help={t('appointment-date-help')}
                            >
                                <div className="ant-picker-wrapper">
                                    <DatePicker
                                        selected={appointmentDate}
                                        onChange={(date: Date | null) => {
                                            if (date) {
                                                const defaultStartTime = new Date(date);
                                                const dayOfWeek = moment(date).format('dddd').toLowerCase();

                                                if (workingHours && workingHours[dayOfWeek]) {
                                                    const [startHours, startMinutes] = workingHours[dayOfWeek].start_time.split(':').map(Number);
                                                    defaultStartTime.setHours(startHours, startMinutes, 0);
                                                    setStartTime(defaultStartTime);

                                                    const defaultEndTime = new Date(date);
                                                    const [endHours, endMinutes] = workingHours[dayOfWeek].end_time.split(':').map(Number);
                                                    defaultEndTime.setHours(endHours, endMinutes, 0);
                                                    setEndTime(defaultEndTime);
                                                }

                                                setAppointmentDate(date);
                                            }
                                        }}
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
                                help={t('cannot-select-dates')}
                            >
                                <div className="time-picker-container" style={{display: 'flex', gap: '10px'}}>
                                    <div style={{flex: 1}}>
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
                                        />
                                    </div>
                                    <div style={{flex: 1}}>
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
                                        />
                                    </div>
                                </div>
                            </Form.Item>
                        </>
                    )}

                    {eventType === 'leave' && leaveType === 'days' && !appointmentOnly && (
                        <Form.Item
                            label={t('leave-date-range')}
                            required
                            help={t('cannot-select-dates')}
                        >
                            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
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

                    {eventType === 'leave' && leaveType === 'hours' && !appointmentOnly && (
                        <>
                            <Form.Item
                                label={t('leave-date')}
                                required
                                help={t('cannot-select-dates')}
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
                                help={t('hours-leave-conflict')}
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
                                        />
                                    </div>
                                </div>
                            </Form.Item>
                        </>
                    )}


                </Form>
            )}
        </Modal>
    );
};

export default AddEventModal;