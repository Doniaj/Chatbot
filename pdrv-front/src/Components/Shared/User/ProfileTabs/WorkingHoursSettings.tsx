import React, { useEffect, useState } from "react";
import { Button, Card, Col, Form, Row, Modal } from "react-bootstrap";
import { Checkbox, message } from 'antd';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';
import { useStore } from "react-redux";
import { useTranslation } from "react-i18next";
import usersApiService from "../../../../util/services/UsersApiService";
import { GetUserInfo } from "../../../../helpers/stringHelper";

// Days of the week constant with translation keys
const DAYS_OF_WEEK = [
    { value: 'monday', translationKey: 'monday' },
    { value: 'tuesday', translationKey: 'tuesday' },
    { value: 'wednesday', translationKey: 'wednesday' },
    { value: 'thursday', translationKey: 'thursday' },
    { value: 'friday', translationKey: 'friday' },
    { value: 'saturday', translationKey: 'saturday' },
    { value: 'sunday', translationKey: 'sunday' }
];

interface User {
    user_id: number;
    working_hours?: any;
}

const WorkingHoursSettings: React.FC = () => {
    const { t, i18n } = useTranslation();
    const store = useStore<any>();
    const user: any = store.getState().Login.user || {}
    const userInfo = user ? user : GetUserInfo()

    const [workHoursModalOpen, setWorkHoursModalOpen] = useState<boolean>(false);
    const [durationModalOpen, setDurationModalOpen] = useState<boolean>(false);
    const [weeklyHours, setWeeklyHours] = useState<{[key: string]: any}>({});
    const [appointmentDuration, setAppointmentDuration] = useState<number>(30); // Default 30 minutes
    const [loading, setLoading] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);



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
                message.error(t('fail-catch'));
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (currentUserId) {
            fetchWorkingHours();
            fetchAppointmentDuration();
        }
    }, [currentUserId]);

    const fetchWorkingHours = () => {
        if (!currentUserId) return;

        setIsLoading(true);

        usersApiService.getWorkingHoursByUserId(currentUserId)
            .then(response => {
                console.log("Working hours API response:", response);

                if (response.data && response.data.working_hours) {
                    console.log("Found working hours in response.data.working_hours");
                    setWeeklyHours(response.data.working_hours);
                    return;
                }

                if (response.data?.data && Array.isArray(response.data.data)) {
                    const currentUserData = response.data.data.find((u: User) => u.user_id === currentUserId);

                    if (currentUserData?.working_hours) {
                        console.log("Found working hours in user object:", currentUserData.working_hours);
                        setWeeklyHours(currentUserData.working_hours);
                        return;
                    }
                }

                // If no working hours found, initialize defaults
                console.log("No working hours found, initializing defaults");
                const initialHours: {[key: string]: any} = {};
                DAYS_OF_WEEK.forEach(day => {
                    initialHours[day.value] = {
                        is_working_day: false
                    };
                });
                setWeeklyHours(initialHours);
            })
            .catch(error => {
                console.error("Error fetching working hours:", error);
                message.error(t('working-hours-save-failed'));

                // Initialize with default hours on error
                const initialHours: {[key: string]: any} = {};
                DAYS_OF_WEEK.forEach(day => {
                    initialHours[day.value] = {
                        is_working_day: false
                    };
                });
                setWeeklyHours(initialHours);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const fetchAppointmentDuration = () => {
        if (!currentUserId) return;

        usersApiService.getAppointmentDurationByUserId(currentUserId)
            .then(response => {
                console.log("Appointment duration API response:", response);

                // Handle the case where the API returns an array of users
                if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    // Find the current user in the array
                    const currentUserData = response.data.data.find(
                        (user: User) => user.user_id === currentUserId
                    );

                    if (currentUserData && currentUserData.appointment_duration !== null) {
                        console.log("Found appointment duration for current user:", currentUserData.appointment_duration);
                        setAppointmentDuration(currentUserData.appointment_duration);
                        return;
                    }
                }

                // Try other possible response formats
                if (response.data && response.data.appointment_duration !== undefined) {
                    console.log("Found appointment_duration in response.data:", response.data.appointment_duration);
                    setAppointmentDuration(response.data.appointment_duration);
                    return;
                }

                if (response.data && response.data.data && response.data.data.appointment_duration !== undefined) {
                    console.log("Found appointment_duration in response.data.data:", response.data.data.appointment_duration);
                    setAppointmentDuration(response.data.data.appointment_duration);
                    return;
                }

                // If no appointment duration was found, use the default
                console.log("No appointment duration found for current user, using default");
                setAppointmentDuration(30);
            })
            .catch(error => {
                console.error("Error fetching appointment duration:", error);
                setAppointmentDuration(30);
            });
    };

    // Handler functions for UI interactions
    const handleDayScheduleChange = (day: string, checked: boolean) => {
        const newWeeklyHours = {...weeklyHours};
        if (checked) {
            // Initialize with default times
            newWeeklyHours[day] = {
                is_working_day: true,
                start: '09:00',
                end: '17:00'
            };
        } else {
            newWeeklyHours[day] = { is_working_day: false };
        }
        setWeeklyHours(newWeeklyHours);
    };

    const handleTimeChange = (day: string, type: 'start' | 'end', timeValue: string) => {
        if (!timeValue) return;

        const newWeeklyHours = {...weeklyHours};
        newWeeklyHours[day] = {
            ...newWeeklyHours[day],
            [type]: timeValue
        };
        setWeeklyHours(newWeeklyHours);
    };

    // Save functions
    const handleSaveWorkHours = () => {
        if (!currentUserId) {
            message.error(t('no-user-id'));
            return;
        }

        setLoading(true);

        usersApiService.addWeekWorkingHours({
            user_id: currentUserId,
            working_hours: weeklyHours
        })
            .then(response => {
                if (response.data.success) {
                    message.success(t('working-hours-saved'));
                    setWorkHoursModalOpen(false);
                } else {
                    message.error(response.data.message || t('working-hours-save-failed'));
                }
            })
            .catch(error => {
                console.error("Error saving weekly work hours:", error);
                message.error(t('working-hours-save-failed'));
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleSaveAppointmentDuration = () => {
        if (!currentUserId) {
            message.error(t('no-user-id'));
            return;
        }

        setLoading(true);

        usersApiService.addAppointmentDuration({
            user_id: currentUserId,
            appointment_duration: appointmentDuration
        })
            .then(response => {
                if (response.data.success) {
                    message.success(t('appointment-duration-saved'));
                    setDurationModalOpen(false);
                } else {
                    message.error(response.data.message || t('appointment-duration-save-failed'));
                }
            })
            .catch(error => {
                console.error("Error saving appointment duration:", error);
                message.error(t('appointment-duration-save-failed'));
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="tab-pane fade show active" id="working-hours-settings" role="tabpanel">

            {isLoading && <div className="text-center p-3">{t('loading')}</div>}
            {!isLoading && (
                <Row>
                    <Col lg={12}>
                        <Card>
                            <Card.Body>
                                <h5 className="fs-16 text-decoration-underline mb-4">
                                    {t('working-hours-and-duration')}
                                </h5>

                                {/* Working Hours Section */}
                                <Row className="mb-4">
                                    <Col>
                                        <Card>
                                            <Card.Body>
                                                <Card.Title>{t('manage-working-hours')}</Card.Title>
                                                <p className="text-muted">
                                                    {t('working-hours-description')}
                                                </p>
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => setWorkHoursModalOpen(true)}
                                                >
                                                    {t('manage-working-hours')}
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Appointment Duration Section */}
                                <Row>
                                    <Col>
                                        <Card>
                                            <Card.Body>
                                                <Card.Title>{t('manage-appointment-duration')}</Card.Title>
                                                <p className="text-muted">
                                                    {t('appointment-duration-hint')}
                                                </p>
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => setDurationModalOpen(true)}
                                                >
                                                    {t('set-appointment-duration')}
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Working Hours Modal */}
            <Modal show={workHoursModalOpen} onHide={() => setWorkHoursModalOpen(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{t('set-weekly-work-hours')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {DAYS_OF_WEEK.map(day => (
                        <Row key={day.value} className="mb-3 align-items-center">
                            <Col xs={3}>
                                <Checkbox
                                    onChange={(e) => handleDayScheduleChange(day.value, e.target.checked)}
                                    checked={weeklyHours[day.value]?.is_working_day === true}
                                >
                                    {t(day.translationKey)}
                                </Checkbox>
                            </Col>
                            {weeklyHours[day.value]?.is_working_day && (
                                <>
                                    <Col xs={4}>
                                        <Form.Label>{t('start')}</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={weeklyHours[day.value]?.start || '09:00'}
                                            onChange={(e) => handleTimeChange(day.value, 'start', e.target.value)}
                                        />
                                    </Col>
                                    <Col xs={4}>
                                        <Form.Label>{t('end')}</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={weeklyHours[day.value]?.end || '17:00'}
                                            onChange={(e) => handleTimeChange(day.value, 'end', e.target.value)}
                                        />
                                    </Col>
                                </>
                            )}
                        </Row>
                    ))}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setWorkHoursModalOpen(false)}>
                        {t('cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSaveWorkHours}
                        disabled={loading}
                    >
                        {loading ? t('updating...') : t('save')}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Appointment Duration Modal */}
            <Modal show={durationModalOpen} onHide={() => setDurationModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{t('set-appointment-duration')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>{t('appointment-duration-minutes')}</Form.Label>
                        <Form.Control
                            type="number"value={appointmentDuration}
                            onChange={(e) => setAppointmentDuration(Number(e.target.value))}
                            min={15}
                            max={120}
                        />
                        <Form.Text muted>
                            {t('appointment-duration-hint')}
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDurationModalOpen(false)}>
                        {t('cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSaveAppointmentDuration}
                        disabled={loading}
                    >
                        {loading ? t('updating...') : t('save')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default WorkingHoursSettings;