import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button, Col, Dropdown, Row, Toast, ToastContainer } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SimpleBar from "simplebar-react";
import notificationApiService from "../util/services/NotificationApiService";
import PushService from "../util/PushService";

interface NotificationType {
    id: number;
    admin_id: number;
    availability_id?: number;
    client_id?: number;
    type: 'appointment_reminder' | 'appointment_created';
    title: string;
    message: string;
    scheduled_for?: string;
    is_read: boolean;
    is_sent?: boolean;
    sent_at?: string | null;
    active?: string;
    status?: string;
    created_at: string;
    updated_at?: string;
    client?: {
        id: number;
        first_name: string;
        last_name: string;
        phone_number: string;
    };
    availability?: {
        id: number;
        appointment_date: string;
        start_time: string;
        end_time: string;
        type: string;
    };
    _suppressToast?: boolean;
}

interface SocketError extends Error {
    message: string;
}

interface SocketStatusData {
    status: string;
    id?: string;
    timestamp?: string;
}

interface ApiResponse {
    data: {
        success: boolean;
        message: string;
        data: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            data: NotificationType[];
        };
    };
}

interface NotificationDropdownProps {
    t?: (key: string) => string;
}

const pushServiceInstance = new PushService();

// Helper function to parse and translate notification messages
const parseAndTranslateMessage = (notification: NotificationType, t: (key: string, options?: any) => string): { title: string, message: string } => {
    // Parse appointment creation messages
    const appointmentCreatedRegex = /New appointment has been created with (.+) on (\d{4}-\d{2}-\d{2}) at (\d{2}:\d{2}:\d{2})/;
    const appointmentCreatedMatch = notification.message.match(appointmentCreatedRegex);

    if (appointmentCreatedMatch && notification.type === 'appointment_created') {
        const [, clientName, date, time] = appointmentCreatedMatch;
        const formattedTime = time.substring(0, 5); // Remove seconds

        return {
            title: t('appointment_created_title') || 'New Appointment Created',
            message: t('appointment_created_message', {
                clientName,
                date,
                time: formattedTime
            }) || `New appointment has been created with ${clientName} on ${date} at ${formattedTime}`
        };
    }

    // Parse "15-Minute Appointment Reminder" messages
    const fifteenMinReminderRegex = /Reminder: You have an appointment with (.+) in (\d+) minutes \((\d{2}:\d{2}:\d{2})\)/;
    const fifteenMinReminderMatch = notification.message.match(fifteenMinReminderRegex);

    if (fifteenMinReminderMatch && notification.type === 'appointment_reminder') {
        const [, clientName, minutes, time] = fifteenMinReminderMatch;
        const formattedTime = time.substring(0, 5); // Remove seconds

        return {
            title: t('fifteen_minute_reminder_title') || '15-Minute Appointment Reminder',
            message: t('fifteen_minute_reminder_message', {
                clientName,
                minutes,
                time: formattedTime
            }) || `Reminder: You have an appointment with ${clientName} in ${minutes} minutes (${formattedTime})`
        };
    }

    // Parse appointment reminder messages
    const appointmentReminderRegex = /You have an appointment with (.+) at (\d{2}:\d{2})/;
    const appointmentReminderMatch = notification.message.match(appointmentReminderRegex);

    if (appointmentReminderMatch && notification.type === 'appointment_reminder') {
        const [, clientName, time] = appointmentReminderMatch;

        return {
            title: t('appointment_reminder_title') || 'Appointment Reminder',
            message: t('appointment_reminder_message', {
                clientName,
                time
            }) || `You have an appointment with ${clientName} at ${time}`
        };
    }

    // Parse "Appointment in X minutes" messages
    const appointmentInMinutesRegex = /Appointment in (\d+) minutes/;
    const appointmentInMinutesMatch = notification.message.match(appointmentInMinutesRegex);

    if (appointmentInMinutesMatch) {
        const [, minutes] = appointmentInMinutesMatch;

        return {
            title: t('appointment_reminder_title') || 'Appointment Reminder',
            message: t('appointment_in_minutes', { minutes }) || `Appointment in ${minutes} minutes`
        };
    }

    // Parse "15-Minute Appointment Reminder" title
    if (notification.title === "15-Minute Appointment Reminder") {
        return {
            title: t('fifteen_minute_reminder_title') || '15-Minute Appointment Reminder',
            message: notification.message
        };
    }

    // Parse "New Appointment Created" title
    if (notification.title === "New Appointment Created") {
        return {
            title: t('appointment_created_title') || 'New Appointment Created',
            message: notification.message
        };
    }

    // Parse "Appointment Reminder" title
    if (notification.title === "Appointment Reminder") {
        return {
            title: t('appointment_reminder_title') || 'Appointment Reminder',
            message: notification.message
        };
    }

    // Fallback to original message if no pattern matches
    return {
        title: notification.title,
        message: notification.message
    };
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = () => {
    const { t } = useTranslation();

    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(10);
    const [socketConnected, setSocketConnected] = useState<boolean>(false);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastHeader, setToastHeader] = useState<string>(t('notification') || 'Notification');
    const [toastVariant, setToastVariant] = useState<string>('light');
    const prevUnreadCountRef = useRef<number>(0);

    const [toastShownRecently, setToastShownRecently] = useState<boolean>(false);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastProcessedNotificationRef = useRef<number | null>(null);

    const pushService = pushServiceInstance;
    const eventsSetupRef = useRef<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("NotificationDropdown mounted");
        fetchNotifications();
        setupSocketEvents();

        pushService.onConnectionChange = (connected: boolean) => {
            console.log("Connection status changed:", connected);
            setSocketConnected(connected);

            if (connected) {
                fetchLatestNotificationsWithToast();
            }
        };

        setSocketConnected(pushService.isConnected === true);

        pushServiceInstance.sendMessage("next.client", {user_id: 1});

        const notificationCheckInterval = setInterval(() => {
            fetchUnreadCount();
        }, 10000); // Check every 10 seconds

        return () => {
            pushService.onConnectionChange = null;
            clearInterval(notificationCheckInterval);

            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        prevUnreadCountRef.current = unreadCount;
    }, [unreadCount]);

    const showNotificationToast = useCallback((message: string, notificationType: string = 'info', notificationId?: number, customTitle?: string) => {
        if (toastShownRecently || (notificationId && notificationId === lastProcessedNotificationRef.current)) {
            console.log("Toast shown recently or notification already processed, skipping toast");
            return;
        }

        console.log("Showing notification toast:", message);

        let variant = 'info';
        if (notificationType === 'appointment_reminder') {
            variant = 'warning';
        } else if (notificationType === 'appointment_created') {
            variant = 'success';
        }

        setToastHeader(customTitle || (t("new") + " " + t("notification")) || 'New Notification');
        setToastMessage(message);
        setToastVariant(variant);
        setShowToast(true);

        setToastShownRecently(true);

        if (notificationId) {
            lastProcessedNotificationRef.current = notificationId;
        }

        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }

        toastTimeoutRef.current = setTimeout(() => {
            setToastShownRecently(false);
            toastTimeoutRef.current = null;
        }, 10000);
    }, [t]);

    const setupSocketEvents = useCallback(() => {
        if (eventsSetupRef.current) {
            console.log("Socket events already set up, will refresh listeners");
        }

        console.log("Setting up socket event listeners");

        const handleNewNotification = (err: SocketError | null, data: any) => {
            if (err) {
                console.error("Socket error:", err);
                pushService.reconnect();
                return;
            }

            let notificationObj: NotificationType | null = null;

            if (data && data.notification) {
                notificationObj = data.notification as NotificationType;
            } else if (data && data.id) {
                notificationObj = data as NotificationType;
            }

            if (notificationObj) {
                if (notificationObj.type === 'appointment_reminder') {
                    if (notificationObj.is_sent) {
                        console.log(`Received sent reminder #${notificationObj.id} - adding to list`);
                        addNotification(notificationObj);
                        return;
                    }

                    if (notificationObj.availability && notificationObj.availability.start_time) {
                        const date = notificationObj.availability.appointment_date ||
                            notificationObj.availability.appointment_date ||
                            new Date().toISOString().split('T')[0];
                        const time = notificationObj.availability.start_time;

                        if (time) {
                            const appointmentTime = new Date(`${date}T${time}`);
                            const now = new Date();
                            const minutesUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (60 * 1000);

                            console.log(`Reminder notification: Appointment is in ${minutesUntilAppointment.toFixed(1)} minutes`);

                            if (minutesUntilAppointment >= 14 && minutesUntilAppointment <= 16) {
                                console.log(`Showing 15-min reminder #${notificationObj.id} with toast`);
                                addNotification(notificationObj);
                                return;
                            }

                            if (minutesUntilAppointment <= 15) {
                                console.log(`Showing upcoming reminder #${notificationObj.id} without toast`);
                                notificationObj._suppressToast = true;
                                addNotification(notificationObj);
                                return;
                            }

                            console.log(`Ignoring far-future reminder #${notificationObj.id} (${minutesUntilAppointment.toFixed(1)} min)`);
                            return;
                        }
                    }
                }

                console.log(`Adding non-reminder notification #${notificationObj.id}`);
                addNotification(notificationObj);
            } else {
                console.warn("Received event without valid notification data:", data);
                fetchNotificationsWithProperFiltering();
            }
        };

        pushService.removeEvent('notification.new');
        pushService.removeEvent('appointment.created');
        pushService.removeEvent('appointment.reminder');
        pushService.removeEvent('socket.status');

        pushService.getEvent((err: SocketError | null, data: any) => {
            console.log("Received notification.new event");
            handleNewNotification(err, data);
        }, 'notification.new');

        pushService.getEvent((err: SocketError | null, data: any) => {
            console.log("Received appointment.created event");
            handleNewNotification(err, data);
        }, 'appointment.created');

        pushService.getEvent((err: SocketError | null, data: any) => {
            console.log("Received appointment.reminder event");
            handleNewNotification(err, data);
        }, 'appointment.reminder');

        pushService.getEvent((err: SocketError | null, data: SocketStatusData) => {
            if (err) {
                console.error("Socket status event error:", err);
                return;
            }
            console.log("Socket status changed:", data);
            if (data && data.status === 'connected') {
                setSocketConnected(true);
                fetchLatestNotifications();
            }
        }, 'socket.status');

        pushService.sendMessage('notification.subscribe', {
            user_id: 1,
            timestamp: new Date().toISOString()
        });

        eventsSetupRef.current = true;

        console.log("Socket event listeners set up completed");

        const refreshInterval = setInterval(() => {
            if (!dropdownOpen) {
                fetchUnreadCount();
            }
        }, 30000);

        return () => {
            clearInterval(refreshInterval);
        };
    }, [dropdownOpen]);

    const addNotification = useCallback((notification: NotificationType & { _suppressToast?: boolean }) => {
        console.log("Adding notification to state:", notification);

        if (!notification.is_read && !notification._suppressToast) {
            const { title, message } = parseAndTranslateMessage(notification, t);

            if (notification.type === 'appointment_reminder' && notification.availability) {
                const appointmentTime = new Date(`${notification.availability.appointment_date || notification.availability.appointment_date}T${notification.availability.start_time}`);
                const currentTime = new Date();
                const diffMinutes = Math.round((appointmentTime.getTime() - currentTime.getTime()) / (1000 * 60));

                if ((diffMinutes >= 14 && diffMinutes <= 16) || notification.is_sent) {
                    showNotificationToast(message, notification.type, notification.id, title);

                    if (!dropdownOpen &&
                        pushService.areNotificationsEnabled &&
                        typeof pushService.areNotificationsEnabled === 'function' &&
                        pushService.areNotificationsEnabled()) {
                        pushService.showNotification(title, {
                            body: message
                        });
                    }
                }
            } else {
                showNotificationToast(message, notification.type, notification.id, title);

                if (!dropdownOpen &&
                    pushService.areNotificationsEnabled &&
                    typeof pushService.areNotificationsEnabled === 'function' &&
                    pushService.areNotificationsEnabled()) {
                    pushService.showNotification(title, {
                        body: message
                    });
                }
            }
        }

        setNotifications(prevNotifications => {
            const exists = prevNotifications.some(n => n.id === notification.id);
            if (exists) {
                console.log("Notification already exists, skipping");
                return prevNotifications;
            }

            console.log("Adding new notification to state");

            if (!notification.is_read) {
                setUnreadCount(prev => prev + 1);
            }

            const updatedNotifications = [notification, ...prevNotifications]
                .sort((a, b) => {
                    const dateA = new Date(a.sent_at || a.created_at).getTime();
                    const dateB = new Date(b.sent_at || b.created_at).getTime();
                    return dateB - dateA;
                })
                .slice(0, limit);

            return updatedNotifications;
        });
    }, [limit, dropdownOpen, showNotificationToast, t]);

    const fetchLatestNotifications = async (): Promise<void> => {
        return fetchNotificationsWithProperFiltering();
    };

    const filterPrematureReminders = (notificationList: NotificationType[]): NotificationType[] => {
        const now = new Date();

        const nonReminderNotifications = notificationList.filter(
            notification => notification.type !== 'appointment_reminder'
        );

        const reminderNotifications = notificationList.filter(notification => {
            if (notification.type !== 'appointment_reminder') {
                return false;
            }

            if (notification.is_sent && notification.sent_at) {
                console.log(`Keeping sent reminder #${notification.id} in the list`);
                return true;
            }

            console.log(`Filtering out unsent reminder #${notification.id}`);
            return false;
        });

        const filteredList = [...nonReminderNotifications, ...reminderNotifications];

        const sortedList = filteredList.sort((a, b) => {
            const dateA = new Date(a.sent_at || a.created_at).getTime();
            const dateB = new Date(b.sent_at || b.created_at).getTime();
            return dateB - dateA;
        });

        console.log(`Kept ${sortedList.length} notifications after filtering and sorting`);
        console.log(`- ${nonReminderNotifications.length} creation/other notifications`);
        console.log(`- ${reminderNotifications.length} sent reminder notifications`);

        return sortedList;
    };

    const fetchNotifications = async (): Promise<void> => {
        try {
            console.log("Fetching initial notifications");
            setLoading(true);
            const response = await notificationApiService.getNotifications({
                page: page,
                limit: limit
            }) as unknown as ApiResponse;

            if (response.data && response.data.success) {
                const allNotifications: NotificationType[] = response.data.data.data;
                console.log("Received initial notifications:", allNotifications.length);

                const filteredNotifications = filterPrematureReminders(allNotifications);
                console.log(`Filtered ${allNotifications.length - filteredNotifications.length} premature reminders`);

                setNotifications(filteredNotifications);

                const unreadCount = filteredNotifications.filter((notif: NotificationType) => !notif.is_read).length;
                console.log("Initial unread count:", unreadCount);
                setUnreadCount(unreadCount);

                prevUnreadCountRef.current = unreadCount;
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async (): Promise<void> => {
        try {
            const response = await notificationApiService.getNotifications({
                page: 1,
                limit: 50
            }) as unknown as ApiResponse;

            if (response.data && response.data.success) {
                const allNotifications: NotificationType[] = response.data.data.data;

                const filteredNotifications = filterPrematureReminders(allNotifications);
                const newCount = filteredNotifications.filter(n => !n.is_read).length;

                console.log("Unread count from filtered notifications:", newCount);

                if (newCount > unreadCount) {
                    console.log(`Unread count increased from ${unreadCount} to ${newCount}`);
                    fetchLatestNotificationsWithToast();
                } else {
                    setUnreadCount(newCount);
                }
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    const fetchLatestNotificationsWithToast = async (): Promise<void> => {
        try {
            console.log("Fetching latest notifications with toast");
            const response = await notificationApiService.getNotifications({
                page: 1,
                limit: limit
            }) as unknown as ApiResponse;

            if (response.data && response.data.success) {
                const allNotifications: NotificationType[] = response.data.data.data;
                console.log("Received latest notifications:", allNotifications.length);

                const filteredNotifications = filterPrematureReminders(allNotifications);

                const currentIds = notifications.map(n => n.id);
                const newNotifications = filteredNotifications.filter(n =>
                    !n.is_read && !currentIds.includes(n.id)
                );

                setNotifications(filteredNotifications);
                setUnreadCount(filteredNotifications.filter(n => !n.is_read).length);

                if (newNotifications.length > 0) {
                    newNotifications.sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );

                    const newestNotification = newNotifications[0];
                    console.log("Showing toast for newest notification:", newestNotification.id);

                    if (newestNotification.type === 'appointment_created' ||
                        (newestNotification.type === 'appointment_reminder' &&
                            filterPrematureReminders([newestNotification]).length > 0)) {

                        const { title, message } = parseAndTranslateMessage(newestNotification, t);

                        showNotificationToast(
                            message,
                            newestNotification.type,
                            newestNotification.id,
                            title
                        );
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching latest notifications:", error);
        }
    };

    const markAsRead = async (id: number, e?: React.MouseEvent): Promise<void> => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        try {
            console.log("Marking notification as read:", id);
            const response = await notificationApiService.markAsRead(id) as any;

            if (response.data && response.data.success) {
                setNotifications(notifications.map((notif: NotificationType) =>
                    notif.id === id ? { ...notif, is_read: true } : notif
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
                console.log("Notification marked as read successfully");
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async (e?: React.MouseEvent): Promise<void> => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        try {
            console.log("Marking all notifications as read");
            const response = await notificationApiService.markAllAsRead() as any;

            if (response.data && response.data.success) {
                setNotifications(notifications.map((notif: NotificationType) => ({ ...notif, is_read: true })));
                setUnreadCount(0);
                console.log("All notifications marked as read successfully");

                showNotificationToast(t("all-notifications-marked-read"), "info");
            }
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            showNotificationToast(t("failed-mark-all-read"), "info");
        }
    };

    const deleteNotification = async (params: number, e?: React.MouseEvent): Promise<void> => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        try {
            console.log("Deleting notification:", params);
            setLoading(true);

            console.log(`Calling deleteNotification API for notification params: ${params}`);

            const response = await notificationApiService.deleteNotification(params) as any;
            console.log("Delete response:", response);

            if (response.data && response.data.success) {
                setNotifications(prevNotifications =>
                    prevNotifications.filter(notif => notif.id !== params)
                );

                const deletedNotification = notifications.find(notif => notif.id === params);
                if (deletedNotification && !deletedNotification.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }

                console.log("Notification deleted successfully");

                showNotificationToast(t("notification-deleted"), "info");

                setTimeout(() => {
                    fetchLatestNotifications();
                }, 500);
            } else {
                console.error("Failed to delete notification:", response);
                showNotificationToast(t("failed-delete-notification"), "info");
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
            showNotificationToast(t("failed-delete-notification"), "info");
        } finally {
            setLoading(false);
        }
    };

    const deleteAllNotificationsWorkaround = async (e?: React.MouseEvent): Promise<void> => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        try {
            console.log("Deleting all notifications (workaround)");
            setLoading(true);

            const notificationIds = notifications.map(notification => notification.id);

            if (notificationIds.length === 0) {
                console.log("No notifications to delete");
                showNotificationToast(t("no-notifications-to-delete"), "info");
                return;
            }

            console.log(`Deleting ${notificationIds.length} notifications one by one`);

            const results = await Promise.allSettled(
                notificationIds.map(id => notificationApiService.deleteNotification(id))
            );

            const successful = results.filter(result => result.status === 'fulfilled').length;
            const failed = results.filter(result => result.status === 'rejected').length;

            console.log(`Deleted ${successful} notifications, ${failed} failed`);

            setNotifications([]);
            setUnreadCount(0);

            if (failed > 0) {
                showNotificationToast(t("deleted-with-failures", { successful, failed }), "info");
            } else {
                showNotificationToast(t("all-notifications-deleted"), "info");
            }

            setTimeout(() => {
                fetchLatestNotifications();
            }, 1000);
        } catch (error) {
            console.error("Error in deleteAllNotificationsWorkaround:", error);
            showNotificationToast(t("failed-delete-all-notifications"), "info");
        } finally {
            setLoading(false);
        }
    };

    const getNotificationIcon = (type: string): JSX.Element => {
        switch (type) {
            case 'appointment_reminder':
                return <i className="bx bx-calendar-check"></i>;
            case 'appointment_created':
                return <i className="bx bx-calendar-plus"></i>;
            default:
                return <i className="bx bx-bell"></i>;
        }
    };

    const formatDate = (notification: NotificationType): string => {
        let dateString;

        if (notification.type === 'appointment_reminder') {
            if (notification.sent_at) {
                dateString = notification.sent_at;
            } else if (notification.scheduled_for) {
                dateString = notification.scheduled_for;
            } else {
                dateString = notification.created_at;
            }
        } else {
            dateString = notification.created_at;
        }

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHrs = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHrs / 24);

        if (diffSec < 60) {
            return t("just-now");
        } else if (diffMin < 60) {
            return t("minutes-ago", { count: diffMin });
        } else if (diffHrs < 24) {
            return t("hours-ago", { count: diffHrs });
        } else {
            return t("days-ago", { count: diffDays });
        }
    };

    const handleDropdownToggle = (isOpen: boolean): void => {
        console.log("Dropdown toggled:", isOpen);
        setDropdownOpen(isOpen);

        if (isOpen) {
            fetchNotificationsWithProperFiltering();
        }
    };

    const fetchNotificationsWithProperFiltering = async (): Promise<void> => {
        try {
            console.log("Fetching notifications with proper filtering");
            setLoading(true);

            const response = await notificationApiService.getNotifications({
                page: page,
                limit: limit
            }) as unknown as ApiResponse;

            if (response.data && response.data.success) {
                const allNotifications: NotificationType[] = response.data.data.data;
                console.log("Received notifications:", allNotifications.length);

                const filteredNotifications = filterPrematureReminders(allNotifications);

                setNotifications(filteredNotifications);

                const unreadCount = filteredNotifications.filter(n => !n.is_read).length;
                setUnreadCount(unreadCount);
            }
        } catch (error) {
            console.error("Error fetching notifications with filtering:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewAllClick = (e: React.MouseEvent): void => {
        e.preventDefault();
        navigate('/notifications');
        setDropdownOpen(false);
    };

    return (
        <React.Fragment>
            <ToastContainer
                position="top-end"
                className="p-3"
                style={{ zIndex: 9999 }}
            >
                <Toast
                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={5000}
                    autohide
                    bg={toastVariant}
                >
                    <Toast.Header closeButton>
                        <strong className="me-auto">{toastHeader}</strong>
                        <small>{t("just-now")}</small>
                    </Toast.Header>
                    <Toast.Body className={toastVariant === 'dark' ? 'text-white' : ''}>
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>

            <Dropdown
                className="topbar-head-dropdown ms-1 header-item"
                id="notificationDropdown"
                show={dropdownOpen}
                onToggle={handleDropdownToggle}
            >
                <Dropdown.Toggle id="notification" type="button" className="btn btn-icon btn-topbar btn-ghost-dark rounded-circle arrow-none">
                    <i className='bi bi-bell fs-18'></i>
                    {unreadCount > 0 && (
                        <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">
                            <span className="notification-badge">{unreadCount}</span>
                            <span className="visually-hidden">{t("unread-messages")}</span>
                        </span>
                    )}
                </Dropdown.Toggle>

                <Dropdown.Menu
                    className="dropdown-menu-lg dropdown-menu-end p-0"
                    aria-labelledby="page-header-notifications-dropdown"
                >
                    <div className="dropdown-head rounded-top" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="p-3 border-bottom border-bottom-dashed">
                            <Row className="align-items-center">
                                <Col>
                                    <h6 className="mb-0 fs-16 fw-semibold">
                                        {t("notifications")}
                                        {unreadCount > 0 && (
                                            <span className="badge badge-soft-danger fs-13 notification-badge ms-1">
                                                {unreadCount}
                                            </span>
                                        )}
                                        {!socketConnected && (
                                            <span className="badge badge-soft-warning fs-11 ms-1" title={t("not-connected") || undefined}>
                                                <i className="bi bi-wifi-off"></i>
                                            </span>
                                        )}
                                    </h6>
                                    <p className="fs-14 text-muted mt-1 mb-0">
                                        {t("you-have")} <span className="fw-semibold notification-unread">{unreadCount}</span> {t("unread-messages")}
                                    </p>
                                </Col>

                                <div className="col-auto d-flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log("Mark all as read clicked");
                                            markAllAsRead(e);
                                        }}
                                        title={t("mark-all-as-read") || undefined}
                                    >
                                        <i className="bi bi-check-all"></i>
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log("Delete all notifications clicked");
                                            deleteAllNotificationsWorkaround(e);
                                        }}
                                        title={t("delete-all-notifications") || undefined}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </Row>
                        </div>
                    </div>

                    <div className="py-2 ps-2" id="notificationItemsTabContent"
                         onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <SimpleBar style={{maxHeight: "300px"}} className="pe-2">
                            {loading ? (
                                <div className="text-center p-2">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">{t("loading")}...</span>
                                    </div>
                                </div>
                            ) : notifications.length > 0 ? (
                                <>
                                    {notifications.filter((notif: NotificationType) => !notif.is_read).length > 0 && (
                                        <>
                                            <h6 className="text-overflow text-muted fs-13 my-2 text-uppercase notification-title">{t("new")}</h6>

                                            {notifications.filter((notif: NotificationType) => !notif.is_read).map((notification: NotificationType) => {
                                                const { title, message } = parseAndTranslateMessage(notification, t);

                                                return (
                                                    <div
                                                        key={notification.id}
                                                        className="text-reset notification-item d-block dropdown-item position-relative unread-message"
                                                    >
                                                        <div className="d-flex">
                                                            <div className="avatar-xs me-3 flex-shrink-0">
                                                                <span className="avatar-title bg-info-subtle text-info rounded-circle fs-16">
                                                                    {getNotificationIcon(notification.type)}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="flex-grow-1"
                                                                onClick={(e: React.MouseEvent) => markAsRead(notification.id, e)}
                                                                style={{cursor: 'pointer'}}
                                                            >
                                                                <h6 className="mt-0 fs-14 mb-2 lh-base">
                                                                    {title}
                                                                </h6>
                                                                <p className="mb-0 fs-12 text-muted">
                                                                    {message}
                                                                </p>
                                                                <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                                                                    <span>
                                                                        <i className="mdi mdi-clock-outline"></i>
                                                                        {formatDate(notification)}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <div className="px-2 fs-15">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        console.log("Delete button clicked for notification:", notification.id);
                                                                        deleteNotification(notification.id, e);
                                                                    }}
                                                                    title={t("delete-notification") || undefined}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}

                                    {notifications.filter((notif: NotificationType) => notif.is_read).length > 0 && (
                                        <>
                                            <h6 className="text-overflow text-muted fs-13 my-2 text-uppercase notification-title">
                                                {t("read-before")}
                                            </h6>

                                            {notifications.filter((notif: NotificationType) => notif.is_read).map((notification: NotificationType) => {
                                                const { title, message } = parseAndTranslateMessage(notification, t);

                                                return (
                                                    <div
                                                        key={notification.id}
                                                        className="text-reset notification-item d-block dropdown-item position-relative"
                                                    >
                                                        <div className="d-flex">
                                                            <div className="avatar-xs me-3 flex-shrink-0">
                                                                <span className="avatar-title bg-secondary-subtle text-secondary rounded-circle fs-16">
                                                                    {getNotificationIcon(notification.type)}
                                                                </span>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h6 className="mt-0 fs-14 mb-2 lh-base">
                                                                    {title}
                                                                </h6>
                                                                <p className="mb-0 fs-12 text-muted">
                                                                    {message}
                                                                </p>
                                                                <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                                                                    <span>
                                                                        <i className="mdi mdi-clock-outline"></i>
                                                                        {formatDate(notification)}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <div className="px-2 fs-15">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        console.log("Delete button clicked for notification:", notification.id);
                                                                        deleteNotification(notification.id, e);
                                                                    }}
                                                                    title={t("delete-notification") || undefined}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-2">
                                    <p className="text-muted">{t("no-notifications-found")}</p>
                                </div>
                            )}
                        </SimpleBar>

                        <div className="notification-actions" id="notification-actions">
                            <div className="d-flex text-muted justify-content-center align-items-center">
                                <button
                                    className="btn btn-link p-0"
                                    onClick={handleViewAllClick}
                                >
                                    {t("view-all-notifications")}
                                </button>
                            </div>
                        </div>
                    </div>
                </Dropdown.Menu>
            </Dropdown>
        </React.Fragment>
    );
};

export default React.memo(NotificationDropdown);