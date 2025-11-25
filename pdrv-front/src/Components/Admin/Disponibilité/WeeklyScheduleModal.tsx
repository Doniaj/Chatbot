import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    TimePicker,
    Checkbox,
    Row,
    Col,
    Button,
    message
} from 'antd';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import usersApiService from '../../../util/services/UsersApiService';

// Days of the week constant
const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
];

interface WeeklyWorkHoursModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: number | null;
    onSuccess?: () => void;
}

const WeeklyWorkHoursModal: React.FC<WeeklyWorkHoursModalProps> = ({
                                                                       isOpen,
                                                                       onClose,
                                                                       currentUserId,
                                                                       onSuccess
                                                                   }) => {
    const [weeklyHours, setWeeklyHours] = useState<{[key: string]: any}>({});
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen && currentUserId) {
            // Initialize with empty structure for all days
            const initialHours: {[key: string]: any} = {};
            DAYS_OF_WEEK.forEach(day => {
                initialHours[day.value] = {
                    is_working_day: false
                };
            });

            fetchWorkingHours(currentUserId, initialHours);
        }
    }, [isOpen, currentUserId]);

    const fetchWorkingHours = async (userId: number, initialHours: {[key: string]: any}) => {
        try {
            const response = await usersApiService.getWorkingHoursByUserId(userId);

            if (response.data.success && response.data.data.working_hours) {
                setWeeklyHours(response.data.data.working_hours);
            } else {
                setWeeklyHours(initialHours);
            }
        } catch (error) {
            console.error("Error fetching working hours:", error);
            setWeeklyHours(initialHours);
        }
    };

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

    const handleTimeChange = (day: string, type: 'start' | 'end', time: Dayjs | null) => {
        if (!time) return;

        const newWeeklyHours = {...weeklyHours};
        newWeeklyHours[day] = {
            ...newWeeklyHours[day],
            [type]: time.format('HH:mm')
        };
        setWeeklyHours(newWeeklyHours);
    };

    const handleSubmit = async () => {
        if (!currentUserId) {
            message.error("No user ID available");
            return;
        }

        setLoading(true);
        try {
            const response = await usersApiService.addWeekWorkingHours({
                user_id: currentUserId,
                working_hours: weeklyHours
            });

            if (response.data.success) {
                message.success("Weekly work hours saved successfully");
                onSuccess && onSuccess();
                onClose();
            } else {
                message.error(response.data.message || "Failed to save weekly work hours");
            }
        } catch (error) {
            console.error("Error saving weekly work hours:", error);
            message.error("Failed to save weekly work hours");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Set Weekly Work Hours"
            open={isOpen}
            onCancel={onClose}
            footer={[
                <Button key="back" onClick={onClose}>Cancel</Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={handleSubmit}
                    loading={loading}
                >
                    Save Work Hours
                </Button>
            ]}
        >
            <Form layout="vertical">
                {DAYS_OF_WEEK.map(day => (
                    <Row key={day.value} align="middle" gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={4}>
                            <Checkbox
                                onChange={(e) => handleDayScheduleChange(day.value, e.target.checked)}
                                checked={weeklyHours[day.value]?.is_working_day === true}
                            >
                                {day.label}
                            </Checkbox>
                        </Col>
                        {weeklyHours[day.value]?.is_working_day && (
                            <>
                                <Col span={10}>
                                    <Form.Item label="Start Time">
                                        <TimePicker
                                            format="HH:mm"
                                            value={weeklyHours[day.value]?.start
                                                ? dayjs(weeklyHours[day.value].start, 'HH:mm')
                                                : undefined}
                                            onChange={(time) => handleTimeChange(day.value, 'start', time)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item label="End Time">
                                        <TimePicker
                                            format="HH:mm"
                                            value={weeklyHours[day.value]?.end
                                                ? dayjs(weeklyHours[day.value].end, 'HH:mm')
                                                : undefined}
                                            onChange={(time) => handleTimeChange(day.value, 'end', time)}
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                    </Row>
                ))}
            </Form>
        </Modal>
    );
};

export default WeeklyWorkHoursModal;