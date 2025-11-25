import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AppointmentStyles.css';
import {
    Col, Container, Row, Card, Table, Button, Badge, Spinner,
    ProgressBar, Dropdown, Nav, Tab, Toast, ToastContainer,
    Modal, Form, ButtonGroup
} from 'react-bootstrap';
import { withTranslation, WithTranslation } from "react-i18next";
import withRouter from "../../../Common/withRouter";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import clientApiService from '../../../util/services/ClientsApiService';
import availabilityApiService from '../../../util/services/AvailabilityApiService';
import usersApiService from '../../../util/services/UsersApiService';
import PushService from "../../../util/PushService";

interface EndAppointmentModalProps {
    show: boolean;
    appointmentId: string | number | null;
    onClose: () => void;
    onConfirm: (appointmentId: string | number, notes: string) => void;
    t: (key: string) => string;
}
interface CancelAppointmentModalProps {
    show: boolean;
    appointmentId: string | number | null;
    onClose: () => void;
    onConfirm: (appointmentId: string | number, notes: string) => void;
    t: (key: string) => string;
}

interface AppointmentStatusCardProps {
    appointmentStatus: AppointmentStatus;
    t: (key: string) => string;
    onEndAppointmentClick: (appointmentId: string | number) => void;
    onCancelClick: (appointmentId: string | number) => void;
    onStartAppointment: (appointmentId: string | number) => void;
}

interface DashboardAppointmentStatusProps {
    appointmentStatus: AppointmentStatus;
    checkAppointmentStatus: () => void;
    onAppointmentCancel: (appointmentId: string | number, notes?: string) => void;
    onStartAppointment: (appointmentId: string | number) => void;
    onEndAppointment: (appointmentId: string | number, notes?: string) => void;
    t: (key: string) => string;
}



interface WeeklyPercentageData {
    name: string;
    value: number;
}
interface Client {
    id: string | number;
    admin_id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    email?: string;
    country_code?: string;
    country?: string;
    birthday?: string;
    insurance_id?: string;
    active: string;
    status: string; // 'Y' or 'N'
    created_at: string;
    updated_at: string;
    visits?: number;
}

interface Availability {
    id: string | number;
    user_id: number;
    type: 'leave' | 'appointment';
    client_id?: number;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    appointment_date?: string;
    date?: string;
    notes?: string;
    active: string;
    status: string;
    created_at: string;
    updated_at: string;
    client?: {
        id: number;
        first_name: string;
        last_name: string;
        email?: string;
        phone_number?: string;
        country_code?: string;
        [key: string]: any;
    };
}


interface ClientGrowth {
    month: string;
    clients: number;
}

interface AppointmentStat {
    month: string;
    treated: number;
    notTreated: number;
}

interface ClientTypeDistribution {
    name: string;
    value: number;
}


interface Stats {
    totalClients: number;
    newClientsThisMonth: number;
    totalAppointments: number;
    completedAppointments: number;
    pendingAppointments: number;
    canceledAppointments: number;
}

interface DashboardProps extends WithTranslation {
    history: any;
    match: any;
    location: any;
}

interface TimeRangeFilterOptions {
    label: string;
    value: string;
}
interface WeeklyAvailabilityData {
    name: string;
    available: number;
    booked: number;
    leaves: number;
    leavePercentage: number;
    appointmentPercentage: number;
}
interface AppointmentStatus {
    hasCurrentAppointment: boolean;
    hasUpcomingAppointment: boolean;
    currentAppointment?: {
        id: string | number;
        clientName: string;
        startTime: string;
        endTime: string;
        remainingMinutes: number;
        // Enhanced timing properties
        scheduledStartTime: string;
        actualStartTime?: string;
        isManuallyStarted: boolean;
        elapsedSinceScheduled: number;
        elapsedSinceActualStart: number;
    };
    upcomingAppointment?: {
        id: string | number;
        clientName: string;
        startTime: string;
        minutesUntil: number;
        secondsUntil: number;
        isOverdue: boolean;
        delayedBySeconds: number;
    };
}
const MODERN_COLORS = ['#645CBB', '#A084DC', '#BFACE2', '#EBC7E6', '#16A34A', '#38BDF8'];
const TREATED_COLOR = '#16A34A';
const NOT_TREATED_COLOR = '#EF4444';
const BOOKED_COLOR = '#645CBB';
const LEAVES_COLOR = '#F97316';
const pushservice= new PushService();

const EndAppointmentModal: React.FC<EndAppointmentModalProps> = React.memo(({
                                                                                show,
                                                                                appointmentId,
                                                                                onClose,
                                                                                onConfirm,
                                                                                t
                                                                            }) => {
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!show) {
            setNotes('');
            setIsProcessing(false);
        }
    }, [show]);

    const handleConfirm = useCallback(async (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!appointmentId || isProcessing) return;

        setIsProcessing(true);
        try {
            await onConfirm(appointmentId, notes);
        } catch (error) {
            console.error('[Modal] Error ending appointment:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [appointmentId, isProcessing, onConfirm, notes]);

    const handleClose = useCallback((e?: any) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!isProcessing) {
            onClose();
        }
    }, [isProcessing, onClose]);

    return (
        <Modal
            show={show}
            onHide={handleClose}
            backdrop="static"
            keyboard={!isProcessing}
            centered
        >
            <Modal.Header closeButton={!isProcessing}>
                <Modal.Title>{t('end_appointment') || 'End Appointment'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>{t('notes_optional') || 'Notes (Optional)'}</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('add_appointment_notes') || 'Add any notes about this appointment...'}
                            disabled={isProcessing}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isProcessing}
                >
                    {t('cancel') || 'Cancel'}
                </Button>
                <Button
                    variant="success"
                    onClick={handleConfirm}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                            {t('processing') || 'Processing...'}
                        </>
                    ) : (
                        <>
                            <i className="bx bx-check me-1"></i>
                            {t('end_appointment') || 'End Appointment'}
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = React.memo(({
                                                                                      show,
                                                                                      appointmentId,
                                                                                      onClose,
                                                                                      onConfirm,
                                                                                      t
                                                                                  }) => {
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!show) {
            setNotes('');
            setIsProcessing(false);
        }
    }, [show]);

    const handleConfirm = useCallback(async (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!appointmentId || isProcessing) return;

        setIsProcessing(true);
        try {
            await onConfirm(appointmentId, notes);
        } catch (error) {
            console.error('[Modal] Error canceling appointment:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [appointmentId, isProcessing, onConfirm, notes]);

    const handleClose = useCallback((e?: any) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!isProcessing) {
            onClose();
        }
    }, [isProcessing, onClose]);

    return (
        <Modal
            show={show}
            onHide={handleClose}
            backdrop="static"
            keyboard={!isProcessing}
            centered
        >
            <Modal.Header closeButton={!isProcessing}>
                <Modal.Title>{t('cancel_appointment') || 'Cancel Appointment'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="mb-3 text-warning">
                    <i className="bx bx-warning me-2"></i>
                    {t('confirm_cancel_appointment') || 'Are you sure you want to cancel this appointment?'}
                </p>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>{t('reason_for_cancellation') || 'Reason for Cancellation (Optional)'}</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('add_cancellation_reason') || 'Add reason for cancellation...'}
                            disabled={isProcessing}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isProcessing}
                >
                    {t('keep_appointment') || 'Keep Appointment'}
                </Button>
                <Button
                    variant="danger"
                    onClick={handleConfirm}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                            {t('processing') || 'Processing...'}
                        </>
                    ) : (
                        <>
                            <i className="bx bx-x me-1"></i>
                            {t('confirm_cancel') || 'Confirm Cancel'}
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

const AppointmentStatusCard: React.FC<AppointmentStatusCardProps> = React.memo(({
                                                                                    appointmentStatus,
                                                                                    t,
                                                                                    onEndAppointmentClick,
                                                                                    onCancelClick,
                                                                                    onStartAppointment
                                                                                }) => {
    const normalizeTime = (timeString: string): string => {
        if (timeString && timeString.includes(':')) {
            const parts = timeString.split(':');
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        return timeString;
    };

    const formatTime = (minutes: number): string => {
        if (minutes < 60) {
            return `${Math.floor(minutes)}${t('min_remaining') || 'm'}`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const hourText = hours === 1 ? t('hour') || 'h' : t('hours') || 'h';
        return mins > 0 ? `${hours}${hourText} ${mins}${t('min_remaining') || 'm'}` : `${hours}${hourText}`;
    };

    const formatPreciseTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (): string => {
        if (appointmentStatus.hasCurrentAppointment) {
            return 'success';
        }
        if (appointmentStatus.hasUpcomingAppointment && appointmentStatus.upcomingAppointment) {
            if (appointmentStatus.upcomingAppointment.minutesUntil <= 15) return 'warning';
            if (appointmentStatus.upcomingAppointment.minutesUntil <= 60) return 'info';
            return 'secondary';
        }
        return 'light';
    };

    const handleEndClick = useCallback((id: string | number) => {
        console.log('[Card] End button clicked for appointment:', id);
        onEndAppointmentClick(id);
    }, [onEndAppointmentClick]);

    const handleCancelClick = useCallback((id: string | number) => {
        console.log('[Card] Cancel button clicked for appointment:', id);
        onCancelClick(id);
    }, [onCancelClick]);

    const handleStartClick = useCallback((id: string | number) => {
        console.log('[Card] Start button clicked for appointment:', id);
        onStartAppointment(id);
    }, [onStartAppointment]);

    if (appointmentStatus.hasCurrentAppointment && appointmentStatus.currentAppointment) {
        const { currentAppointment } = appointmentStatus;
        return (
            <Card className="border-0 shadow-sm mb-4 appointment-status-card">
                <Card.Body>
                    <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                            <div className={`avatar-sm rounded-circle bg-${getStatusColor()}`}>
                                <span className="avatar-title text-white">
                                    <i className="bx bx-user-voice fs-4"></i>
                                </span>
                            </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                            <div className="d-flex align-items-center mb-1">
                                <h5 className="mb-0 me-2">{t('in_appointment') || 'In Appointment'}</h5>
                                <Badge bg={getStatusColor()} className="fs-6">{t('busy') || 'BUSY'}</Badge>
                            </div>
                            <p className="text-muted mb-1 client-name">
                                {t('with') || 'With'} {currentAppointment.clientName}
                            </p>

                            <div className="timing-info">
                                {currentAppointment.isManuallyStarted && currentAppointment.actualStartTime && (
                                    <small className="text-muted d-block">
                                        <i className="bx bx-play me-1"></i>
                                        {t('started') || 'Started'}: {normalizeTime(currentAppointment.actualStartTime)} |
                                        {t('session_time') || 'Session time'}: <span className="fw-bold text-success">
                                            {formatPreciseTime(currentAppointment.elapsedSinceActualStart * 60)}
                                        </span>
                                    </small>
                                )}

                                <small className="text-muted d-block">
                                    <i className="bx bx-hourglass me-1"></i>
                                    {t('ends') || 'Ends'}: {normalizeTime(currentAppointment.endTime)} |
                                    {t('remaining') || 'Remaining'}: <span className="fw-bold text-warning">
                                        {formatTime(currentAppointment.remainingMinutes)}
                                    </span>
                                </small>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <ButtonGroup>
                                <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleEndClick(currentAppointment.id)}
                                >
                                    <i className="bx bx-check me-1"></i>
                                    {t('end') || 'End'}
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleCancelClick(currentAppointment.id)}
                                >
                                    <i className="bx bx-x me-1"></i>
                                    {t('cancel') || 'Cancel'}
                                </Button>
                            </ButtonGroup>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    if (appointmentStatus.hasUpcomingAppointment && appointmentStatus.upcomingAppointment) {
        const { upcomingAppointment } = appointmentStatus;

        return (
            <Card className="border-0 shadow-sm mb-4 appointment-status-card">
                <Card.Body>
                    <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                            <div className={`avatar-sm rounded-circle bg-${getStatusColor()} bg-opacity-10`}>
                                <span className={`avatar-title text-${getStatusColor()}`}>
                                    <i className="bx bx-time-five fs-4"></i>
                                </span>
                            </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                            <div className="d-flex align-items-center mb-1">
                                <h5 className="mb-0 me-2">{t('next_appointment') || 'Next Appointment'}</h5>
                                <Badge
                                    bg={upcomingAppointment.isOverdue ? 'danger' : getStatusColor()}
                                    className="fs-6"
                                >
                                    {upcomingAppointment.isOverdue ?
                                        (t('overdue') || 'OVERDUE') :
                                        (t('upcoming') || 'UPCOMING')
                                    }
                                </Badge>
                            </div>
                            <p className="text-muted mb-1 client-name">
                                {t('with') || 'With'} {upcomingAppointment.clientName}
                            </p>
                            <div className="countdown-info">
                                {upcomingAppointment.isOverdue ? (
                                    <>
                                        <p className="mb-1 fw-bold text-success fs-5">
                                            <i className="bx bx-play me-1"></i>
                                            {t('ready_to_start_now') || 'Ready to start now!'}
                                        </p>
                                        <p className="mb-1 fw-bold text-danger fs-6">
                                            <i className="bx bx-exclamation-triangle me-1"></i>
                                            {t('delayed_by') || 'Delayed by'}: {formatPreciseTime(upcomingAppointment.delayedBySeconds)}
                                        </p>
                                    </>
                                ) : (
                                    <p className="mb-1 fw-bold text-primary fs-5">
                                        <i className="bx bx-alarm me-1"></i>
                                        {t('starts_in') || 'Starts in'}: {formatPreciseTime(upcomingAppointment.secondsUntil)}
                                    </p>
                                )}

                                <small className="text-muted">
                                    <i className="bx bx-calendar me-1"></i>
                                    {t('scheduled') || 'Scheduled'}: {normalizeTime(upcomingAppointment.startTime)}
                                </small>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <ButtonGroup>
                                <Button
                                    variant={upcomingAppointment.isOverdue ? "success" : "outline-success"}
                                    size="sm"
                                    onClick={() => handleStartClick(upcomingAppointment.id)}
                                    className={upcomingAppointment.isOverdue ? "pulse-animation" : ""}
                                >
                                    <i className="bx bx-play me-1"></i>
                                    {t('start') || 'Start'}
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleCancelClick(upcomingAppointment.id)}
                                >
                                    <i className="bx bx-x me-1"></i>
                                    {t('cancel') || 'Cancel'}
                                </Button>
                            </ButtonGroup>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-sm mb-4 appointment-status-card">
            <Card.Body>
                <div className="d-flex align-items-center">
                    <div className="flex-shrink-0">
                        <div className="avatar-sm rounded-circle bg-light">
                            <span className="avatar-title text-muted">
                                <i className="bx bx-calendar-check fs-4"></i>
                            </span>
                        </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                        <h5 className="mb-0">{t('no_appointments') || 'No Appointments'}</h5>
                        <p className="text-muted mb-0">
                            {t('no_current_or_upcoming_appointments') || 'You have no current or upcoming appointments scheduled for today.'}
                        </p>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
});


const DashboardAppointmentStatus: React.FC<DashboardAppointmentStatusProps> = React.memo(({
                                                                                              appointmentStatus,
                                                                                              checkAppointmentStatus,
                                                                                              onAppointmentCancel,
                                                                                              onStartAppointment,
                                                                                              onEndAppointment,
                                                                                              t
                                                                                          }) => {
    const [endModalState, setEndModalState] = useState({
        show: false,
        appointmentId: null as string | number | null
    });

    const [cancelModalState, setCancelModalState] = useState({
        show: false,
        appointmentId: null as string | number | null
    });

    const openEndModal = useCallback((appointmentId: string | number) => {
        console.log('[Modal] Opening end modal for appointment:', appointmentId);
        setEndModalState({
            show: true,
            appointmentId
        });
    }, []);

    const openCancelModal = useCallback((appointmentId: string | number) => {
        console.log('[Modal] Opening cancel modal for appointment:', appointmentId);
        setCancelModalState({
            show: true,
            appointmentId
        });
    }, []);

    const closeEndModal = useCallback(() => {
        console.log('[Modal] Closing end modal');
        setEndModalState({
            show: false,
            appointmentId: null
        });
    }, []);

    const closeCancelModal = useCallback(() => {
        console.log('[Modal] Closing cancel modal');
        setCancelModalState({
            show: false,
            appointmentId: null
        });
    }, []);

    const handleEndConfirm = useCallback(async (appointmentId: string | number, notes: string) => {
        console.log('[Modal] Confirming end appointment:', appointmentId);
        try {
            await onEndAppointment(appointmentId, notes);
            closeEndModal();
        } catch (error) {
            console.error('[Modal] Error ending appointment:', error);
        }
    }, [onEndAppointment, closeEndModal]);

    const handleCancelConfirm = useCallback(async (appointmentId: string | number, notes: string) => {
        console.log('[Modal] Confirming cancel appointment:', appointmentId);
        try {
            await onAppointmentCancel(appointmentId, notes);
            closeCancelModal();
        } catch (error) {
            console.error('[Modal] Error canceling appointment:', error);
        }
    }, [onAppointmentCancel, closeCancelModal]);

    return (
        <>
            <Row className="mb-4">
                <Col lg={12}>
                    <AppointmentStatusCard
                        appointmentStatus={appointmentStatus}
                        t={t}
                        onEndAppointmentClick={openEndModal}
                        onCancelClick={openCancelModal}
                        onStartAppointment={onStartAppointment}
                    />
                </Col>
            </Row>

            <EndAppointmentModal
                show={endModalState.show}
                appointmentId={endModalState.appointmentId}
                onClose={closeEndModal}
                onConfirm={handleEndConfirm}
                t={t}
            />

            <CancelAppointmentModal
                show={cancelModalState.show}
                appointmentId={cancelModalState.appointmentId}
                onClose={closeCancelModal}
                onConfirm={handleCancelConfirm}
                t={t}
            />
        </>
    );
});
const Dashboard: React.FC<DashboardProps> = (props) => {
    const { t } = props;
    document.title = t('dashboard');
    const [modalState, setModalState] = useState({
        endModal: { open: false },
        cancelModal: { open: false },
    });
    const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
    const [cancelNotes, setCancelNotes] = useState<string>('');
    const [appointmentToCancel, setAppointmentToCancel] = useState<string | number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [timeRange, setTimeRange] = useState<string>('6m'); // Default to 6 months
    const [stats, setStats] = useState<Stats>({
        totalClients: 0,
        newClientsThisMonth: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        pendingAppointments: 0,
        canceledAppointments: 0
    });
    const [weeklyPercentageData, setWeeklyPercentageData] = useState<WeeklyPercentageData[]>([]);
    const [clientGrowth, setClientGrowth] = useState<ClientGrowth[]>([]);
    const [appointmentStats, setAppointmentStats] = useState<AppointmentStat[]>([]);
    const [availabilityData, setAvailabilityData] = useState<WeeklyAvailabilityData[]>([
        { name: t('monday') || 'Mon', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
        { name: t('tuesday') || 'Tue', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
        { name: t('wednesday') || 'Wed', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
        { name: t('thursday') || 'Thu', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
        { name: t('friday') || 'Fri', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
        { name: t('saturday') || 'Sat', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
        { name: t('sunday') || 'Sun', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 }
    ]);

    const [recentClients, setRecentClients] = useState<Client[]>([]);
    const [clientTypeDistribution, setClientTypeDistribution] = useState<ClientTypeDistribution[]>([]);
    const [adminId, setAdminId] = useState<string | number | null>(null);
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatus>({
        hasCurrentAppointment: false,
        hasUpcomingAppointment: false
    });
    const [showAppointmentToast, setShowAppointmentToast] = useState<boolean>(false);
    const appointmentCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const appointmentCountdownRef = useRef<NodeJS.Timeout | null>(null);
    const lastNotifiedAppointmentRef = useRef<string | null>(null);
    const timeRangeOptions: TimeRangeFilterOptions[] = [
        { label: t('last_3_months') || 'Last 3 Months', value: '3m' },
        { label: t('last_6_months') || 'Last 6 Months', value: '6m' },
        { label: t('last_year') || 'Last Year', value: '12m' },
        { label: t('all_time') || 'All Time', value: 'all' }
    ];

    const fetchClientDetails = async (clientId: string | number): Promise<string> => {
        try {
            console.log(`[Dashboard] 🔄 Fetching client details for ID ${clientId} using getClientById...`);

            const startTime = performance.now();
            const response = await clientApiService.getClientById(clientId);
            const endTime = performance.now();

            console.log(`[Dashboard] 📡 getClientById completed in ${(endTime - startTime).toFixed(2)}ms`);
            console.log(`[Dashboard] 📋 getClientById response:`, {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });

            if (!response.data) {
                console.error(`[Dashboard] ❌ No response.data found`);
                return `Client ${clientId}`;
            }

            let client = null;

            if (response.data.first_name && response.data.last_name) {
                client = response.data;
                console.log(`[Dashboard] 📝 Client data found directly in response.data`);
            }
            else if (response.data.data && Array.isArray(response.data.data)) {
                console.log(`[Dashboard] 📝 Client data is in array format, searching for client ID ${clientId}...`);
                console.log(`[Dashboard] 📝 Array contains ${response.data.data.length} clients`);

                const foundClient = response.data.data.find((c: any) => c.id == clientId || c.client_id == clientId);

                if (foundClient) {
                    client = foundClient;
                    console.log(`[Dashboard] 📝 Found client in array:`, foundClient);
                } else {
                    console.warn(`[Dashboard] ⚠️ Client ID ${clientId} not found in array of ${response.data.data.length} clients`);
                    console.log(`[Dashboard] 📝 Available client IDs:`, response.data.data.map((c: any) => c.id || c.client_id));
                    return `Client ${clientId}`;
                }
            }
            else if (response.data.data && response.data.data.first_name && response.data.data.last_name) {
                client = response.data.data;
                console.log(`[Dashboard] 📝 Client data found in response.data.data (single object)`);
            }
            else if (response.data.client && response.data.client.first_name && response.data.client.last_name) {
                client = response.data.client;
                console.log(`[Dashboard] 📝 Client data found in response.data.client`);
            }
            else if (response.data.success && response.data.client) {
                client = response.data.client;
                console.log(`[Dashboard] 📝 Client data found in response.data.client (with success flag)`);
            }
            else if (response.data.success && response.data.first_name && response.data.last_name) {
                client = response.data;
                console.log(`[Dashboard] 📝 Client data found in response.data (with success flag)`);
            }
            else {
                console.error(`[Dashboard] ❌ Unexpected response structure. Available keys:`, Object.keys(response.data));
                console.error(`[Dashboard] ❌ Full response.data:`, response.data);

                if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    console.log(`[Dashboard] 📝 First item in data array:`, response.data.data[0]);
                    console.log(`[Dashboard] 📝 Keys of first item:`, Object.keys(response.data.data[0]));
                }

                return `Client ${clientId}`;
            }

            if (!client) {
                console.error(`[Dashboard] ❌ No client data found in response`);
                return `Client ${clientId}`;
            }

            console.log(`[Dashboard] 👤 Found client:`, {
                id: client.id,
                first_name: client.first_name,
                last_name: client.last_name,
                admin_id: client.admin_id,
                email: client.email
            });

            if (!client.first_name || !client.last_name) {
                console.warn(`[Dashboard] ⚠️ Client ${clientId} missing name data:`, {
                    first_name: client.first_name,
                    last_name: client.last_name
                });
                return `Client ${clientId}`;
            }

            if (client.first_name.trim() === '' || client.last_name.trim() === '') {
                console.warn(`[Dashboard] ⚠️ Client ${clientId} has empty name fields`);
                return `Client ${clientId}`;
            }

            const fullName = `${client.first_name.trim()} ${client.last_name.trim()}`;
            console.log(`[Dashboard] ✅ Successfully fetched client name: "${fullName}"`);
            return fullName;

        } catch (error) {
            console.error(`[Dashboard] 💥 Error in getClientById for client ${clientId}:`, {
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            return `Client ${clientId}`;
        }
    };

    const getClientName = async (appointment: Availability): Promise<string> => {
        console.log(`[Dashboard] === GETTING CLIENT NAME FOR APPOINTMENT ${appointment.id} ===`);
        console.log(`[Dashboard] Appointment details:`, {
            id: appointment.id,
            client_id: appointment.client_id,
            client: appointment.client
        });

        if (appointment.client &&
            appointment.client.first_name &&
            appointment.client.last_name &&
            appointment.client.first_name.trim() !== '' &&
            appointment.client.last_name.trim() !== '' &&
            !(appointment.client.first_name === 'John' && appointment.client.last_name === 'Doe') &&
            appointment.client.first_name !== 'Unknown' &&
            appointment.client.last_name !== 'Unknown') {

            const fullName = `${appointment.client.first_name.trim()} ${appointment.client.last_name.trim()}`;
            console.log(`[Dashboard] ✅ Using existing client data: ${fullName}`);
            return fullName;
        }

        if (appointment.client_id) {
            console.log(`[Dashboard] 🔄 Fetching client via getClientById for client_id: ${appointment.client_id}`);
            return await fetchClientDetails(appointment.client_id);
        }

        console.log(`[Dashboard] ❌ No client_id found`);
        return 'Unknown Client';
    };

    const checkAppointmentStatus = useCallback(async () => {
        if (!adminId) {
            console.log("[Dashboard] No adminId available");
            return;
        }

        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

            console.log(`[Dashboard] === DEBUGGING APPOINTMENT STATUS ===`);
            console.log(`[Dashboard] Current time: ${currentTime}`);
            console.log(`[Dashboard] Today: ${today}`);
            console.log(`[Dashboard] AdminId: ${adminId}`);

            const filterParamsObject = {
                filter: [
                    {
                        operator: 'and',
                        conditions: [
                            {
                                field: 'user_id',
                                operator: 'eq',
                                value: adminId
                            },
                            {
                                field: 'type',
                                operator: 'eq',
                                value: 'appointment'
                            },
                            {
                                field: 'start_date',
                                operator: 'eq',
                                value: today
                            },
                            {
                                field: 'active',
                                operator: 'eq',
                                value: 'Y'
                            },
                            {
                                field: 'status',
                                operator: 'ne',
                                value: 'N'
                            }
                        ]
                    }
                ],
                sort: [
                    {
                        field: 'start_time',
                        direction: 'asc'
                    }
                ],
                limit: 100
            };

            const filterParams = JSON.stringify(filterParamsObject);
            console.log(`[Dashboard] Filter params:`, filterParams);

            const response = await availabilityApiService.findAvailability(filterParams);

            let allAppointments: Availability[] = [];

            if (response.status === 200 && response.data && response.data.data && Array.isArray(response.data.data)) {
                allAppointments = response.data.data;
            }

            console.log(`[Dashboard] Total NON-CANCELED appointments from API: ${allAppointments.length}`);

            const todayAppointments = allAppointments.filter((apt: Availability) => {
                const appointmentDate = apt.start_date;
                const isToday = appointmentDate === today;
                const isAppointment = apt.type === 'appointment';
                const isActive = apt.active === 'Y';
                const isNotCanceled = apt.status !== 'N'; // Not canceled

                console.log(`[Dashboard] Filtering appointment ${apt.id}: date=${appointmentDate}, today=${today}, isToday=${isToday}, type=${apt.type}, active=${apt.active}, status=${apt.status}, isNotCanceled=${isNotCanceled}`);

                return isToday && isAppointment && isActive && isNotCanceled;
            });

            console.log(`[Dashboard] Filtered TODAY appointments (non-canceled): ${todayAppointments.length}`, todayAppointments);

            const normalizeTime = (timeString: string): string => {
                if (timeString && timeString.includes(':')) {
                    const parts = timeString.split(':');
                    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                }
                return timeString;
            };

            const normalizedCurrentTime = normalizeTime(currentTime);

            const currentAppointment = todayAppointments.find((appointment: Availability) => {
                const isManuallyStarted = appointment.notes && appointment.notes.includes('STARTED_MANUALLY');
                const isManuallyEnded = appointment.notes && appointment.notes.includes('ENDED_MANUALLY');

                console.log(`[Dashboard] Checking appointment ${appointment.id} for CURRENT:`);
                console.log(`[Dashboard] - Status: ${appointment.status}`);
                console.log(`[Dashboard] - Notes: ${appointment.notes}`);
                console.log(`[Dashboard] - Is manually started: ${isManuallyStarted}`);
                console.log(`[Dashboard] - Is manually ended: ${isManuallyEnded}`);

                // Show as current ONLY if manually started AND NOT manually ended
                return isManuallyStarted && !isManuallyEnded;
            });

            console.log(`[Dashboard] Current BUSY appointment found:`, currentAppointment);

            let nextAppointment: Availability | undefined = undefined;

            if (!currentAppointment) {
                const upcomingAppointments = todayAppointments.filter((apt: Availability) => {
                    const isNotManuallyStarted = !apt.notes || !apt.notes.includes('STARTED_MANUALLY');
                    const isNotEnded = !apt.notes || !apt.notes.includes('ENDED_MANUALLY');
                    const isNotCanceled = apt.status !== 'N';

                    console.log(`[Dashboard] Checking appointment ${apt.id} for UPCOMING:`);
                    console.log(`[Dashboard] - Status: ${apt.status}`);
                    console.log(`[Dashboard] - Notes: ${apt.notes}`);
                    console.log(`[Dashboard] - Is not manually started: ${isNotManuallyStarted}`);
                    console.log(`[Dashboard] - Is not ended: ${isNotEnded}`);
                    console.log(`[Dashboard] - Is not canceled: ${isNotCanceled}`);
                    console.log(`[Dashboard] - Should show as upcoming: ${isNotManuallyStarted && isNotEnded && isNotCanceled}`);

                    return isNotManuallyStarted && isNotEnded && isNotCanceled;
                });

                console.log(`[Dashboard] Found upcoming appointments:`, upcomingAppointments);

                nextAppointment = upcomingAppointments
                    .sort((a: Availability, b: Availability) =>
                        normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time))
                    )[0];

                console.log(`[Dashboard] Next upcoming appointment:`, nextAppointment);
            }

            if (currentAppointment) {
                console.log(`[Dashboard] Processing current appointment ${currentAppointment.id}`);

                const clientName = await getClientName(currentAppointment);

                const [startHour, startMinute] = normalizeTime(currentAppointment.start_time).split(':').map(Number);
                const [endHour, endMinute] = normalizeTime(currentAppointment.end_time).split(':').map(Number);

                const scheduledStartTime = new Date(now);
                scheduledStartTime.setHours(startHour, startMinute, 0, 0);

                const scheduledEndTime = new Date(now);
                scheduledEndTime.setHours(endHour, endMinute, 0, 0);

                const elapsedSinceScheduledMs = now.getTime() - scheduledStartTime.getTime();
                const elapsedSinceScheduled = Math.max(0, elapsedSinceScheduledMs / (60 * 1000));

                const isManuallyStarted = !!(currentAppointment.notes && currentAppointment.notes.includes('STARTED_MANUALLY'));                let actualStartTime = null;
                let elapsedSinceActualStart = 0;

                if (isManuallyStarted) {
                    const actualStartTimeStr = currentAppointment.start_time; // This should be updated when manually started
                    const [actualStartHour, actualStartMinute] = normalizeTime(actualStartTimeStr).split(':').map(Number);
                    actualStartTime = new Date(now);
                    actualStartTime.setHours(actualStartHour, actualStartMinute, 0, 0);

                    const elapsedSinceActualStartMs = now.getTime() - actualStartTime.getTime();
                    elapsedSinceActualStart = Math.max(0, elapsedSinceActualStartMs / (60 * 1000));
                }

                const remainingMs = scheduledEndTime.getTime() - now.getTime();
                const remainingMinutes = Math.max(0, remainingMs / (60 * 1000));

                setAppointmentStatus({
                    hasCurrentAppointment: true,
                    hasUpcomingAppointment: false,
                    currentAppointment: {
                        id: currentAppointment.id,
                        clientName,
                        startTime: currentAppointment.start_time,
                        endTime: currentAppointment.end_time,
                        remainingMinutes: Math.floor(remainingMinutes),
                        // Enhanced timing properties
                        scheduledStartTime: normalizeTime(currentAppointment.start_time),
                        actualStartTime: actualStartTime ? normalizeTime(actualStartTime.toTimeString().split(' ')[0].substring(0, 5)) : undefined,
                        isManuallyStarted,
                        elapsedSinceScheduled: Math.floor(elapsedSinceScheduled),
                        elapsedSinceActualStart: Math.floor(elapsedSinceActualStart)
                    }
                });

            } else if (nextAppointment) {
                console.log(`[Dashboard] Processing next appointment ${nextAppointment.id}`);

                const clientName = await getClientName(nextAppointment);

                const [startHour, startMinute] = normalizeTime(nextAppointment.start_time).split(':').map(Number);
                const startDateTime = new Date(now);
                startDateTime.setHours(startHour, startMinute, 0, 0);

                const msUntil = startDateTime.getTime() - now.getTime();
                const minutesUntil = Math.max(0, msUntil / (60 * 1000));
                const secondsUntil = Math.max(0, msUntil / 1000);

                const isOverdue = msUntil < 0;
                const delayedBySeconds = isOverdue ? Math.abs(msUntil / 1000) : 0;

                setAppointmentStatus({
                    hasCurrentAppointment: false,
                    hasUpcomingAppointment: true,
                    upcomingAppointment: {
                        id: nextAppointment.id,
                        clientName,
                        startTime: nextAppointment.start_time,
                        minutesUntil: Math.floor(minutesUntil),
                        secondsUntil: Math.floor(secondsUntil),
                        isOverdue,
                        delayedBySeconds: Math.floor(delayedBySeconds)
                    }
                });
            } else {
                console.log(`[Dashboard] No current or upcoming appointments found for today`);
                setAppointmentStatus({
                    hasCurrentAppointment: false,
                    hasUpcomingAppointment: false
                });
            }

        } catch (error) {
            console.error("[Dashboard] Error checking appointment status:", error);
        }
    }, [adminId]);
    const normalizeTime = (timeString: string): string => {
        if (timeString && timeString.includes(':')) {
            const parts = timeString.split(':');
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        return timeString;
    };

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await usersApiService.getCurrentUser();
                if (response.data.success) {
                    setAdminId(response.data.user.user_id);
                }
            } catch (error) {
                console.error("Error fetching current user:", error);
            }
        };

        fetchCurrentUser();

        const setupSocketListeners = () => {
            pushservice.getEvent((err: any, data: any) => {
                if (err) {
                    console.error("Socket error:", err);
                    return;
                }
                console.log("[Dashboard] Received appointment reminder:", data);

                if (adminId) {
                    setTimeout(() => checkAppointmentStatus(), 500);
                }
            }, 'appointment.reminder');

            pushservice.getEvent((err: any, data: any) => {
                if (err) {
                    console.error("Socket error:", err);
                    return;
                }
                console.log("[Dashboard] Received appointment created:", data);

                if (adminId) {
                    setTimeout(() => checkAppointmentStatus(), 1000);
                }
            }, 'appointment.created');

            pushservice.getEvent((err: any, data: any) => {
                if (err) {
                    console.error("Socket error:", err);
                    return;
                }
                console.log("[Dashboard] Received notification:", data);

                if (adminId) {
                    setTimeout(() => checkAppointmentStatus(), 500);
                }
            }, 'notification.new');

            pushservice.getEvent((err: any, data: any) => {
                if (err) {
                    console.error("Socket error:", err);
                    return;
                }
                console.log("[Dashboard] Received dashboard appointment update:", data);

                if (data && data.admin_id === Number(adminId)) {
                    setTimeout(() => checkAppointmentStatus(), 500);
                }
            }, 'dashboard.appointment.update');

            pushservice.getEvent((err: any, data: any) => {
                if (err) {
                    console.error("Socket error:", err);
                    return;
                }
                console.log("[Dashboard] Received appointment status update:", data);

                if (data && data.admin_id === Number(adminId)) {
                    setTimeout(() => checkAppointmentStatus(), 500);
                }
            }, 'dashboard.appointment.status');
        };

        setupSocketListeners();

        pushservice.sendMessage('dashboard.connected', {
            user_id: adminId || 'pending',
            timestamp: new Date().toISOString()
        });

        return () => {
            if (appointmentCheckIntervalRef.current) {
                clearInterval(appointmentCheckIntervalRef.current);
            }
            if (appointmentCountdownRef.current) {
                clearInterval(appointmentCountdownRef.current);
            }

            pushservice.removeEvent('appointment.reminder');
            pushservice.removeEvent('appointment.created');
            pushservice.removeEvent('notification.new');
        };
    }, [adminId]);
    useEffect(() => {
        if (adminId) {
            fetchDashboardData();
            checkAppointmentStatus();

            const appointmentInterval = setInterval(checkAppointmentStatus, 30000);

            const timingInterval = setInterval(() => {
                setAppointmentStatus(prev => {
                    if (!prev.hasCurrentAppointment && !prev.hasUpcomingAppointment) {
                        return prev;
                    }

                    const updated = { ...prev };

                    if (updated.hasCurrentAppointment && updated.currentAppointment) {
                        updated.currentAppointment.elapsedSinceScheduled += (1/60); // Add 1 second in minutes
                        if (updated.currentAppointment.isManuallyStarted) {
                            updated.currentAppointment.elapsedSinceActualStart += (1/60);
                        }

                        const newRemaining = Math.max(0, updated.currentAppointment.remainingMinutes - (1/60));
                        updated.currentAppointment.remainingMinutes = newRemaining;

                        if (newRemaining <= 0) {
                            setTimeout(() => checkAppointmentStatus(), 1000);
                        }
                    }

                    if (updated.hasUpcomingAppointment && updated.upcomingAppointment) {
                        if (updated.upcomingAppointment.isOverdue) {
                            updated.upcomingAppointment.delayedBySeconds += 1;
                            updated.upcomingAppointment.secondsUntil = 0;
                            updated.upcomingAppointment.minutesUntil = 0;
                        } else {
                            const newSecondsUntil = Math.max(0, updated.upcomingAppointment.secondsUntil - 1);
                            updated.upcomingAppointment.secondsUntil = newSecondsUntil;
                            updated.upcomingAppointment.minutesUntil = Math.floor(newSecondsUntil / 60);

                            if (newSecondsUntil <= 0) {
                                updated.upcomingAppointment.isOverdue = true;
                                updated.upcomingAppointment.delayedBySeconds = 0;
                                setTimeout(() => checkAppointmentStatus(), 1000);
                            }
                        }
                    }

                    return updated;
                });
            }, 1000);
            return () => {
                clearInterval(appointmentInterval);
                clearInterval(timingInterval);
            };
        }
    }, [adminId, checkAppointmentStatus]);
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const clientFilterObject = {
                filter: [
                    {
                        operator: 'and',
                        conditions: [
                            {
                                field: 'admin_id',
                                operator: 'eq',
                                value: adminId
                            }
                        ]
                    }
                ],
                limit: 1000,
                offset: 0
            };

            const clientFilterParams = JSON.stringify(clientFilterObject);

            console.log("[Dashboard] Fetching clients with params:", clientFilterParams);
            const clientsResponse = await clientApiService.findClients(clientFilterParams);

            const allClients: Client[] = clientsResponse.data.data || [];
            const clients: Client[] = allClients.filter((client: Client) => client.admin_id === Number(adminId));

            console.log("[Dashboard] Found clients:", clients.length);

            const availabilityFilterObject = {
                filter: [
                    {
                        operator: 'and',
                        conditions: [
                            {
                                field: 'user_id',
                                operator: 'eq',
                                value: adminId
                            }
                        ]
                    }
                ],
                limit: 1000
            };

            const availabilityFilterParams = JSON.stringify(availabilityFilterObject);

            console.log("[Dashboard] Fetching availability with params:", availabilityFilterParams);
            const availabilityResponse = await availabilityApiService.findAvailability(availabilityFilterParams);
            const availabilities: Availability[] = availabilityResponse.data.data || [];

            console.log("[Dashboard] Found availabilities:", availabilities.length);

            const totalClients = clients.length;

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const newClientsThisMonth = clients.filter((client: Client) =>
                new Date(client.created_at).getTime() >= startOfMonth.getTime()
            ).length;

            const sortedClients = [...clients].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setRecentClients(sortedClients.slice(0, 5));

            let monthsToShow = 6; // Default
            switch (timeRange) {
                case '3m': monthsToShow = 3; break;
                case '12m': monthsToShow = 12; break;
                case 'all': monthsToShow = 24; break;
                default: monthsToShow = 6;
            }

            const clientGrowthData: ClientGrowth[] = [];
            for (let i = monthsToShow - 1; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = getTranslatedMonth(month, t);
                const clientsInMonth = clients.filter(client => {
                    const clientDate = new Date(client.created_at);
                    return clientDate.getMonth() === month.getMonth() &&
                        clientDate.getFullYear() === month.getFullYear();
                }).length;
                clientGrowthData.push({ month: monthName, clients: clientsInMonth });
            }
            setClientGrowth(clientGrowthData);

            const appointments = availabilities.filter(avail =>
                avail.type === 'appointment' &&
                avail.active === 'Y' &&
                avail.user_id === Number(adminId)
            );
            const totalAppointments = appointments.length;
            const treatedAppointments = appointments.filter(appt => appt.status === 'Y').length;
            const notTreatedAppointments = appointments.filter(appt => appt.status === 'N').length;

            const clientsWithAppointments = new Map<number | string, number>();
            appointments.forEach(appt => {
                if (appt.client_id) {
                    const count = clientsWithAppointments.get(appt.client_id) || 0;
                    clientsWithAppointments.set(appt.client_id, count + 1);
                }
            });

            const returning = Array.from(clientsWithAppointments.entries())
                .filter(([clientId, count]) => count > 1)
                .length;

            const newClientCount = Array.from(clientsWithAppointments.entries())
                .filter(([clientId, count]) => count === 1)
                .length;

            setClientTypeDistribution([
                { name: t('returning_clients') || 'Returning Clients', value: returning },
                { name: t('new_clients') || 'New Clients', value: newClientCount }
            ]);

            const appointmentsByMonth: AppointmentStat[] = [];
            for (let i = monthsToShow - 1; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = getTranslatedMonth(month, t);

                const apptsInMonth = appointments.filter(appt => {
                    const apptDate = new Date(appt.appointment_date || appt.start_date);
                    return apptDate.getMonth() === month.getMonth() &&
                        apptDate.getFullYear() === month.getFullYear();
                });

                const treated = apptsInMonth.filter(appt => appt.status === 'Y').length;
                const notTreated = apptsInMonth.filter(appt => appt.status === 'N').length;

                appointmentsByMonth.push({
                    month: monthName,
                    treated,
                    notTreated
                });
            }
            setAppointmentStats(appointmentsByMonth);
            const adminAvailabilities = availabilities.filter(avail =>
                avail.user_id === Number(adminId)
            );

            const weeklyAvailabilityData: WeeklyAvailabilityData[] = [
                { name: t('monday') || 'Mon', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
                { name: t('tuesday') || 'Tue', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
                { name: t('wednesday') || 'Wed', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
                { name: t('thursday') || 'Thu', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
                { name: t('friday') || 'Fri', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
                { name: t('saturday') || 'Sat', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 },
                { name: t('sunday') || 'Sun', available: 0, booked: 0, leaves: 0, leavePercentage: 0, appointmentPercentage: 0 }
            ];

            adminAvailabilities.forEach(avail => {
                const dayOfWeek = new Date(avail.start_date).getDay();
                const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for 0-indexed Sunday

                if (avail.type === 'appointment') {
                    weeklyAvailabilityData[dayIndex].booked += 1;
                } else if (avail.type === 'leave') {
                    weeklyAvailabilityData[dayIndex].leaves += 1;
                }
                weeklyAvailabilityData[dayIndex].available += 1;
            });

            weeklyAvailabilityData.forEach(day => {
                const totalSlots = day.available;
                day.leavePercentage = totalSlots > 0
                    ? Math.round((day.leaves / totalSlots) * 100)
                    : 0;
                day.appointmentPercentage = totalSlots > 0
                    ? Math.round((day.booked / totalSlots) * 100)
                    : 0;
            });

            setAvailabilityData(weeklyAvailabilityData);

            setStats({
                totalClients,
                newClientsThisMonth,
                totalAppointments,
                completedAppointments: treatedAppointments,
                pendingAppointments: notTreatedAppointments,
                canceledAppointments: 0
            });

            const totalLeaves = adminAvailabilities.filter(avail => avail.type === 'leave').length;
            const totalAppointment = adminAvailabilities.filter(avail => avail.type === 'appointment').length;
            const totalSlots = totalLeaves + totalAppointment;

            const percentageData: WeeklyPercentageData[] = [
                {
                    name: t('leaves') || 'Leaves',
                    value: totalSlots > 0
                        ? Math.round((totalLeaves / totalSlots) * 100)
                        : 0
                },
                {
                    name: t('appointments') || 'Appointments',
                    value: totalSlots > 0
                        ? Math.round((totalAppointment / totalSlots) * 100)
                        : 0
                }
            ];

            setWeeklyPercentageData(percentageData);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };
    const appointmentCompletionRate = stats.totalAppointments > 0
        ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
        : 0;

    const getTranslatedMonth = (date: Date, t: any): string => {
        const monthIndex = date.getMonth();
        const monthKeys = [
            'month_jan', 'month_feb', 'month_mar', 'month_apr',
            'month_may', 'month_jun', 'month_jul', 'month_aug',
            'month_sep', 'month_oct', 'month_nov', 'month_dec'
        ];
        return t(monthKeys[monthIndex]);
    };






    const handleStartAppointment = useCallback(async (appointmentId: string | number) => {
        try {
            console.log("[Dashboard] Starting appointment:", appointmentId);

            const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

            const updateData = {
                id: appointmentId,
                start_time: currentTime,
                notes: 'STARTED_MANUALLY',

            };

            await availabilityApiService.updateAvailability(updateData);

            setTimeout(() => checkAppointmentStatus(), 500);

            setShowAppointmentToast(true);

        } catch (error) {
            console.error("[Dashboard] Error starting appointment:", error);
        }
    }, [checkAppointmentStatus]);
    const handleEndAppointment = useCallback(async (appointmentId: string | number, notes?: string) => {
        try {
            console.log("[Dashboard] 🏁 Starting end appointment process:", appointmentId);

            const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
            console.log("[Dashboard] 🕐 Current time for ending:", currentTime);

            const currentNotes = notes || '';
            const existingFlags = currentNotes.includes('STARTED_MANUALLY') ? 'STARTED_MANUALLY ' : '';

            const updateData = {
                id: appointmentId,
                end_time: currentTime,
                notes: existingFlags + (notes || '') + ' ENDED_MANUALLY',
                status: 'Y'
            };

            console.log("[Dashboard] 📤 Ending appointment with data:", updateData);

            const endResponse = await availabilityApiService.updateAvailability(updateData);
            console.log("[Dashboard] 📥 End appointment response:", {
                status: endResponse.status,
                statusText: endResponse.statusText
            });

            if (endResponse.status === 200) {
                console.log("[Dashboard] ✅ Appointment ended successfully");

                console.log("[Dashboard] ⏱️ Waiting 500ms before adjusting next appointments...");
                setTimeout(async () => {
                    console.log("[Dashboard] 🔧 Starting time adjustment for conflicting appointments...");
                    await adjustNextAppointmentStartTime(appointmentId, currentTime);
                }, 500);
            } else {
                console.error("[Dashboard] ❌ Failed to end appointment. Status:", endResponse.status);
            }

            setTimeout(() => {
                console.log("[Dashboard] 🔄 Final status refresh...");
                checkAppointmentStatus();
            }, 3000);

            setShowAppointmentToast(true);

        } catch (error) {
            console.error("[Dashboard] 💥 Error ending appointment:", error);
        }
    }, [checkAppointmentStatus]);
    const handleCancelAppointment = useCallback(async (appointmentId: string | number, notes?: string) => {
        try {
            console.log("[Dashboard] Canceling appointment:", appointmentId);

            const updateData = {
                id: appointmentId,
                status: 'N',
                notes: notes || '',
            };

            await availabilityApiService.updateAvailability(updateData);

            setTimeout(() => {
                checkAppointmentStatus();
                fetchDashboardData();
            }, 500);

            setShowAppointmentToast(true);

        } catch (error) {
            console.error("[Dashboard] Error canceling appointment:", error);
        }
    }, [checkAppointmentStatus]);
    const adjustNextAppointmentStartTime = async (endedAppointmentId: string | number, newEndTime: string) => {
        try {
            console.log(`[Dashboard] 🚀 === STARTING APPOINTMENT TIME ADJUSTMENT ===`);
            console.log(`[Dashboard] 📋 Input parameters:`);
            console.log(`[Dashboard]   - Ended appointment ID: ${endedAppointmentId}`);
            console.log(`[Dashboard]   - New end time: ${newEndTime}`);
            console.log(`[Dashboard]   - Admin ID: ${adminId}`);

            const today = new Date().toISOString().split('T')[0];
            console.log(`[Dashboard]   - Today's date: ${today}`);

            const filterParams = JSON.stringify({
                filter: [{
                    operator: 'and',
                    conditions: [
                        { field: 'user_id', operator: 'eq', value: adminId },
                        { field: 'type', operator: 'eq', value: 'appointment' },
                        { field: 'start_date', operator: 'eq', value: today },
                        { field: 'active', operator: 'eq', value: 'Y' },
                        { field: 'status', operator: 'ne', value: 'Y' }, // Not yet treated
                        { field: 'status', operator: 'ne', value: 'N' }  // Not canceled
                    ]
                }],
                sort: [{ field: 'start_time', direction: 'asc' }]
            });

            console.log(`[Dashboard] 🔍 Fetching appointments with filter:`, filterParams);

            const response = await availabilityApiService.findAvailability(filterParams);
            const appointments = response.data.data || [];

            console.log(`[Dashboard] 📊 API Response:`);
            console.log(`[Dashboard]   - Status: ${response.status}`);
            console.log(`[Dashboard]   - Total appointments found: ${appointments.length}`);

            console.log(`[Dashboard] 📋 All remaining appointments (not treated/canceled):`);
            appointments.forEach((apt: Availability, index: number) => {
                console.log(`[Dashboard]   ${index + 1}. ID: ${apt.id}, Start: ${apt.start_time}, End: ${apt.end_time}, Status: ${apt.status}, Notes: "${apt.notes || 'none'}"`);
            });

            console.log(`[Dashboard] 🔍 Checking for conflicts with end time: ${newEndTime}`);

            const conflictingAppointments = appointments.filter((apt: Availability) => {
                const isDifferentAppointment = apt.id !== endedAppointmentId;
                const appointmentStartTime = normalizeTime(apt.start_time);
                const endTime = normalizeTime(newEndTime);
                const startsBeforeOrAtEndTime = appointmentStartTime <= endTime;
                const isNotStarted = !apt.notes?.includes('STARTED_MANUALLY');
                const isNotEnded = !apt.notes?.includes('ENDED_MANUALLY');

                console.log(`[Dashboard] 🔍 Checking appointment ${apt.id}:`);
                console.log(`[Dashboard]     - Different from ended (${endedAppointmentId}): ${isDifferentAppointment}`);
                console.log(`[Dashboard]     - Start time "${appointmentStartTime}" <= end time "${endTime}": ${startsBeforeOrAtEndTime}`);
                console.log(`[Dashboard]     - Not manually started: ${isNotStarted}`);
                console.log(`[Dashboard]     - Not manually ended: ${isNotEnded}`);

                const hasConflict = isDifferentAppointment && startsBeforeOrAtEndTime && isNotStarted && isNotEnded;
                console.log(`[Dashboard]     - 🎯 HAS CONFLICT: ${hasConflict}`);

                return hasConflict;
            });

            console.log(`[Dashboard] ⚠️ Found ${conflictingAppointments.length} conflicting appointments`);

            if (conflictingAppointments.length === 0) {
                console.log(`[Dashboard] ✅ No conflicts found - no adjustments needed`);
                return;
            }

            conflictingAppointments.sort((a: Availability, b: Availability) =>
                normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time))
            );

            console.log(`[Dashboard] 📝 Conflicting appointments (sorted by start time):`);
            conflictingAppointments.forEach((apt: Availability, index: number) => {
                console.log(`[Dashboard]   ${index + 1}. ID: ${apt.id}, Current start: ${apt.start_time}, End: ${apt.end_time}`);
            });

            console.log(`[Dashboard] 🕐 Calculating new start times...`);
            console.log(`[Dashboard]   - Base end time: ${newEndTime}`);

            const [endHour, endMinute] = newEndTime.split(':').map(Number);
            console.log(`[Dashboard]   - Parsed end time: ${endHour}:${endMinute.toString().padStart(2, '0')}`);

            for (let i = 0; i < conflictingAppointments.length; i++) {
                const appointment = conflictingAppointments[i];

                let newStartHour = endHour;
                let newStartMinute = endMinute + 1 + i;

                while (newStartMinute >= 60) {
                    newStartMinute -= 60;
                    newStartHour += 1;
                }

                if (newStartHour >= 24) {
                    newStartHour = 23;
                    newStartMinute = 59;
                    console.warn(`[Dashboard] ⚠️ Hour overflow for appointment ${appointment.id}`);
                }

                const adjustedStartTime = `${newStartHour.toString().padStart(2, '0')}:${newStartMinute.toString().padStart(2, '0')}`;

                console.log(`[Dashboard] 🔄 Processing appointment ${i + 1}/${conflictingAppointments.length}:`);
                console.log(`[Dashboard]   - Appointment ID: ${appointment.id}`);
                console.log(`[Dashboard]   - Original start time: ${appointment.start_time}`);
                console.log(`[Dashboard]   - Calculated new start time: ${adjustedStartTime}`);
                console.log(`[Dashboard]   - Time adjustment: ${appointment.start_time} → ${adjustedStartTime}`);

                const updateData = {
                    id: appointment.id,
                    start_time: adjustedStartTime
                };

                console.log(`[Dashboard] 📤 Sending update request:`, updateData);

                try {
                    const updateResponse = await availabilityApiService.updateAvailability(updateData);

                    console.log(`[Dashboard] 📥 Update response for appointment ${appointment.id}:`);
                    console.log(`[Dashboard]   - Status: ${updateResponse.status}`);
                    console.log(`[Dashboard]   - Status Text: ${updateResponse.statusText}`);
                    console.log(`[Dashboard]   - Response data:`, updateResponse.data);

                    if (updateResponse.status === 200) {
                        console.log(`[Dashboard] ✅ SUCCESS: Appointment ${appointment.id} updated from ${appointment.start_time} to ${adjustedStartTime}`);
                    } else {
                        console.error(`[Dashboard] ❌ FAILED: Update failed for appointment ${appointment.id}. Status: ${updateResponse.status}`);
                        console.error(`[Dashboard] ❌ Response:`, updateResponse.data);
                    }
                } catch (updateError) {
                    console.error(`[Dashboard] 💥 ERROR updating appointment ${appointment.id}:`, {
                        error: updateError,
                        message: updateError instanceof Error ? updateError.message : 'Unknown error',
                        stack: updateError instanceof Error ? updateError.stack : undefined
                    });
                }
            }

            console.log(`[Dashboard] 🔍 Verification: Re-fetching appointments to confirm updates...`);

            try {
                const verificationResponse = await availabilityApiService.findAvailability(filterParams);
                const updatedAppointments = verificationResponse.data.data || [];

                console.log(`[Dashboard] ✅ Verification results:`);
                console.log(`[Dashboard]   - Total appointments after update: ${updatedAppointments.length}`);

                console.log(`[Dashboard] 📋 Updated appointment times:`);
                updatedAppointments.forEach((apt: Availability, index: number) => {
                    const wasUpdated = conflictingAppointments.some((ca: Availability) => ca.id === apt.id);
                    const statusIcon = wasUpdated ? '🔄' : '📋';
                    console.log(`[Dashboard]   ${statusIcon} ${index + 1}. ID: ${apt.id}, Start: ${apt.start_time}, End: ${apt.end_time}${wasUpdated ? ' (UPDATED)' : ''}`);
                });

                const successfulUpdates = conflictingAppointments.filter((originalApt: Availability) => {
                    const updatedApt = updatedAppointments.find((ua: Availability) => ua.id === originalApt.id);
                    return updatedApt && updatedApt.start_time !== originalApt.start_time;
                });

                console.log(`[Dashboard] 📊 Update Summary:`);
                console.log(`[Dashboard]   - Appointments that needed updating: ${conflictingAppointments.length}`);
                console.log(`[Dashboard]   - Successfully updated appointments: ${successfulUpdates.length}`);

                if (successfulUpdates.length === conflictingAppointments.length) {
                    console.log(`[Dashboard] 🎉 ALL UPDATES SUCCESSFUL!`);
                } else {
                    console.warn(`[Dashboard] ⚠️ Some updates may have failed. Check individual appointment logs above.`);
                }

            } catch (verificationError) {
                console.error(`[Dashboard] ❌ Error during verification:`, verificationError);
            }

            console.log(`[Dashboard] 🔄 Scheduling appointment status refresh in 2 seconds...`);
            setTimeout(() => {
                console.log(`[Dashboard] 🔄 Refreshing appointment status after adjustments...`);
                checkAppointmentStatus();
            }, 2000);

            console.log(`[Dashboard] 🏁 === APPOINTMENT TIME ADJUSTMENT COMPLETED ===`);

        } catch (error) {
            console.error(`[Dashboard] 💥 CRITICAL ERROR in adjustNextAppointmentStartTime:`, {
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                endedAppointmentId,
                newEndTime,
                adminId
            });
        }
    };
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip p-3 bg-white shadow rounded">
                    <p className="mb-1 fw-bold">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                            {entry.name}: <span className="fw-bold">{entry.value}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };


    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {loading ? (
                        <div className="text-center my-5">
                            <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                                <span className="visually-hidden">{t('loading') || 'Loading...'}</span>
                            </Spinner>
                            <p className="mt-3 text-muted">{t('loading_dashboard') || 'Loading dashboard data...'}</p>
                        </div>
                    ) : (
                        <>
                            <Row className="mb-4 align-items-center">
                                <Col>
                                    <h1 className="fw-bold mb-0">{t('dashboard') || 'Dashboard'}</h1>
                                </Col>
                                <Col xs="auto">
                                    <Dropdown>
                                        <Dropdown.Toggle variant="outline-secondary" id="timerange-dropdown">
                                            {timeRangeOptions.find(option => option.value === timeRange)?.label || 'Time Range'}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {timeRangeOptions.map((option) => (
                                                <Dropdown.Item
                                                    key={option.value}
                                                    active={timeRange === option.value}
                                                    onClick={() => setTimeRange(option.value)}
                                                >
                                                    {option.label}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Col>
                            </Row>
                            <DashboardAppointmentStatus
                                appointmentStatus={appointmentStatus}
                                checkAppointmentStatus={checkAppointmentStatus}
                                onAppointmentCancel={(appointmentId, notes) => handleCancelAppointment(appointmentId, notes)}
                                onStartAppointment={handleStartAppointment}
                                onEndAppointment={handleEndAppointment}
                                t={t}
                            />
                            <Tab.Container id="dashboard-tabs" defaultActiveKey="overview" onSelect={(k) => setActiveTab(k || 'overview')}>
                                <Row className="mb-4">
                                    <Col>
                                        <Nav variant="pills" className="nav-fill">
                                            <Nav.Item>
                                                <Nav.Link eventKey="overview" className="rounded-pill">
                                                    <i className="bx bx-home me-1"></i> {t('overview') || 'Overview'}
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="appointments" className="rounded-pill">
                                                    <i className="bx bx-calendar me-1"></i> {t('appointments') || 'Appointments'}
                                                </Nav.Link>
                                            </Nav.Item>
                                        </Nav>
                                    </Col>
                                </Row>

                                <Tab.Content>
                                    <Tab.Pane eventKey="overview">
                                        <Row className="mb-4">
                                            <Col xl={3} md={6}>
                                                <Card className="h-100 border-0 shadow-sm">
                                                    <Card.Body>
                                                        <div className="d-flex align-items-center mb-3">
                                                            <div className="flex-shrink-0">
                                                                <div className="avatar-sm rounded-circle bg-primary bg-opacity-10">
                                                                    <span className="avatar-title text-primary">
                                                                        <i className="bx bx-user-circle fs-4"></i>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6 className="text-muted mb-1">{t('total_clients') || 'Total Clients'}</h6>
                                                                <h2 className="mb-0 fs-4">{stats.totalClients}</h2>
                                                            </div>
                                                        </div>
                                                        <p className="text-muted mb-0 small">
                                                            <i className="bx bx-trending-up me-1 text-success"></i>
                                                            {stats.newClientsThisMonth} {t('new_this_month') || 'new this month'}
                                                        </p>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col xl={3} md={6}>
                                                <Card className="h-100 border-0 shadow-sm">
                                                    <Card.Body>
                                                        <div className="d-flex align-items-center mb-3">
                                                            <div className="flex-shrink-0">
                                                                <div className="avatar-sm rounded-circle bg-success bg-opacity-10">
                                                                    <span className="avatar-title text-success">
                                                                        <i className="bx bx-calendar-check fs-4"></i>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6 className="text-muted mb-1">{t('total_appointments') || 'Total Appointments'}</h6>
                                                                <h2 className="mb-0 fs-4">{stats.totalAppointments}</h2>
                                                            </div>
                                                        </div>
                                                        <p className="text-muted mb-0 small">
                                                            <i className="bx bx-check-circle me-1 text-success"></i>
                                                            {stats.completedAppointments} {t('treated') || 'treated'}
                                                        </p>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col xl={3} md={6}>
                                                <Card className="h-100 border-0 shadow-sm">
                                                    <Card.Body>
                                                        <div className="d-flex align-items-center mb-3">
                                                            <div className="flex-shrink-0">
                                                                <div className="avatar-sm rounded-circle bg-warning bg-opacity-10">
                                                                    <span className="avatar-title text-warning">
                                                                        <i className="bx bx-time fs-4"></i>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6 className="text-muted mb-1">{t('pending_appointments') || 'Pending Appointments'}</h6>
                                                                <h2 className="mb-0 fs-4">{stats.pendingAppointments}</h2>
                                                            </div>
                                                        </div>
                                                        <p className="text-muted mb-0 small">
                                                            <i className="bx bx-calendar me-1"></i>
                                                            {t('to_be_treated') || 'To be treated'}
                                                        </p>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col xl={3} md={6}>
                                                <Card className="h-100 border-0 shadow-sm">
                                                    <Card.Body>
                                                        <div className="d-flex align-items-center mb-3">
                                                            <div className="flex-shrink-0">
                                                                <div className="avatar-sm rounded-circle bg-info bg-opacity-10">
                                                                    <span className="avatar-title text-info">
                                                                        <i className="bx bx-chart fs-4"></i>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6 className="text-muted mb-1">{t('treatment_rate') || 'Treatment Rate'}</h6>
                                                                <h2 className="mb-0 fs-4">{appointmentCompletionRate}%</h2>
                                                            </div>
                                                        </div>
                                                        <ProgressBar
                                                            now={appointmentCompletionRate}
                                                            variant={appointmentCompletionRate > 70 ? "success" : appointmentCompletionRate > 40 ? "warning" : "danger"}
                                                            className="mt-2"
                                                        />
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>

                                        <Row className="mb-4">
                                            <Col xl={6}>
                                                <Card className="border-0 shadow-sm h-100">
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between mb-4">
                                                            <Card.Title>{t('client_growth') || 'Client Growth'}</Card.Title>
                                                            <div className="card-actions">
                                                                <Button variant="link" className="p-0 text-muted">
                                                                    <i className="bx bx-dots-horizontal-rounded"></i>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <AreaChart
                                                                data={clientGrowth}
                                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                                                <XAxis
                                                                    dataKey="month"
                                                                    tick={{ fontSize: 12 }}
                                                                    tickLine={false}
                                                                    axisLine={{ stroke: '#E5E7EB' }}
                                                                />
                                                                <YAxis
                                                                    tickLine={false}
                                                                    axisLine={{ stroke: '#E5E7EB' }}
                                                                    tick={{ fontSize: 12 }}
                                                                />
                                                                <Tooltip content={<CustomTooltip />} />
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="clients"
                                                                    name={(t('new_clients') || 'New Clients') as string}
                                                                    stroke={MODERN_COLORS[0]}
                                                                    fill={MODERN_COLORS[0]}
                                                                    fillOpacity={0.2}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col xl={6}>
                                                <Card className="border-0 shadow-sm h-100">
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between mb-4">
                                                            <Card.Title>{t('appointment_treatment_status') || 'Appointment Treatment Status'}</Card.Title>
                                                            <div className="card-actions">
                                                                <Button variant="link" className="p-0 text-muted">
                                                                    <i className="bx bx-dots-horizontal-rounded"></i>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart
                                                                data={appointmentStats}
                                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                                barGap={8}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                                                <XAxis
                                                                    dataKey="month"
                                                                    tick={{ fontSize: 12 }}
                                                                    tickLine={false}
                                                                    axisLine={{ stroke: '#E5E7EB' }}
                                                                />
                                                                <YAxis
                                                                    tickLine={false}
                                                                    axisLine={{ stroke: '#E5E7EB' }}
                                                                    tick={{ fontSize: 12 }}
                                                                />
                                                                <Tooltip content={<CustomTooltip />} />
                                                                <Legend
                                                                    iconType="circle"
                                                                    iconSize={8}
                                                                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                                                                />


                                                                <Bar
                                                                    dataKey="treated"
                                                                    name={(t('treated') || 'Treated') as string}
                                                                    fill={TREATED_COLOR}
                                                                    radius={[4, 4, 0, 0]}
                                                                />
                                                                <Bar
                                                                    dataKey="notTreated"
                                                                    name={(t('not_treated') || 'Not Treated') as string}
                                                                    fill={NOT_TREATED_COLOR}
                                                                    radius={[4, 4, 0, 0]}
                                                                />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>

                                        <Row className="mb-4">
                                            <Col xl={12}>
                                                <Card className="border-0 shadow-sm h-100">
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between mb-4">
                                                            <Card.Title>{t('client_distribution') || 'Client Distribution'}</Card.Title>
                                                            <div className="card-actions">
                                                                <Button variant="link" className="p-0 text-muted">
                                                                    <i className="bx bx-dots-horizontal-rounded"></i>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <ResponsiveContainer width="100%" height={220}>
                                                            <PieChart>
                                                                <Pie
                                                                    data={clientTypeDistribution}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={60}
                                                                    outerRadius={80}
                                                                    paddingAngle={5}
                                                                    dataKey="value"
                                                                >
                                                                    {clientTypeDistribution.map((entry, index) => (
                                                                        <Cell
                                                                            key={`cell-${index}`}
                                                                            fill={index === 0 ? '#10b981' : '#3b82f6'}
                                                                        />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip
                                                                    formatter={(value, name) => [
                                                                        `${value} (${Math.round((value as number /
                                                                            (clientTypeDistribution[0].value + clientTypeDistribution[1].value)) * 100)}%)`,
                                                                        name
                                                                    ]}
                                                                    contentStyle={{
                                                                        borderRadius: '8px',
                                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                                        border: 'none',
                                                                        padding: '8px 12px'
                                                                    }}
                                                                />
                                                                <Legend
                                                                    layout="vertical"
                                                                    verticalAlign="middle"
                                                                    align="right"
                                                                    iconType="circle"
                                                                    iconSize={10}
                                                                    formatter={(value, entry, index) => (
                                                                        <span style={{ color: '#333', fontSize: '14px', marginLeft: '4px' }}>{value}</span>
                                                                    )}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </Card.Body>
                                                </Card>
                                            </Col>


                                        </Row>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="appointments">
                                        {/* Appointments Tab Content */}
                                        <Row className="mb-4">
                                            <Col xl={12}>
                                                <Card className="border-0 shadow-sm">
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between mb-4">
                                                            <Card.Title>{t('appointment_summary') || 'Appointment Summary'}</Card.Title>

                                                        </div>
                                                        <Row className="g-3">
                                                            <Col md={4}>
                                                                <Card className="border bg-success-subtle h-100">
                                                                    <Card.Body className="text-center">
                                                                        <i className="bx bx-check-circle text-success fs-1 mb-2"></i>
                                                                        <h4 className="fs-2 mb-0 text-success">{stats.completedAppointments}</h4>
                                                                        <p className="card-text">{t('treated_appointments') || 'Treated Appointments'}</p>
                                                                    </Card.Body>
                                                                </Card>
                                                            </Col>
                                                            <Col md={4}>
                                                                <Card className="border bg-warning-subtle h-100">
                                                                    <Card.Body className="text-center">
                                                                        <i className="bx bx-time text-warning fs-1 mb-2"></i>
                                                                        <h4 className="fs-2 mb-0 text-warning">{stats.pendingAppointments}</h4>
                                                                        <p className="card-text">{t('not_treated_appointments') || 'Not Treated Appointments'}</p>
                                                                    </Card.Body>
                                                                </Card>
                                                            </Col>
                                                            <Col md={4}>
                                                                <Card className="border bg-info-subtle h-100">
                                                                    <Card.Body className="text-center">
                                                                        <i className="bx bx-calendar text-info fs-1 mb-2"></i>
                                                                        <h4 className="fs-2 mb-0 text-info">{stats.totalAppointments}</h4>
                                                                        <p className="card-text">{t('total_appointments') || 'Total Appointments'}</p>
                                                                    </Card.Body>
                                                                </Card>
                                                            </Col>
                                                        </Row>

                                                        <div className="mt-4">
                                                            <h5 className="mb-3">{t('treatment_progress') || 'Treatment Progress'}</h5>
                                                            <ProgressBar className="progress-lg">
                                                                <ProgressBar variant="success" now={stats.completedAppointments} max={stats.totalAppointments || 1} key={1} />
                                                                <ProgressBar variant="warning" now={stats.pendingAppointments} max={stats.totalAppointments || 1} key={2} />
                                                            </ProgressBar>
                                                            <div className="d-flex justify-content-between mt-2 text-muted small">
                                                                <span>{stats.completedAppointments} {t('treated') || 'Treated'}</span>
                                                                <span>{stats.pendingAppointments} {t('pending') || 'Pending'}</span>
                                                                <span>{stats.totalAppointments} {t('total') || 'Total'}</span>
                                                            </div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col xl={12}>
                                                <Card className="border-0 shadow-sm h-100">
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between mb-4">
                                                            <Card.Title>{t('weekly_time_distribution') || 'Weekly Time Distribution'}</Card.Title>
                                                            <div className="card-actions">
                                                                <Button variant="link" className="p-0 text-muted">
                                                                    <i className="bx bx-dots-horizontal-rounded"></i>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <ResponsiveContainer width="100%" height={220}>
                                                            <PieChart>
                                                                <Pie
                                                                    data={weeklyPercentageData}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={60}
                                                                    outerRadius={80}
                                                                    paddingAngle={5}
                                                                    dataKey="value"
                                                                >
                                                                    {weeklyPercentageData.map((entry, index) => (
                                                                        <Cell
                                                                            key={`cell-${index}`}
                                                                            fill={index === 0 ? LEAVES_COLOR : BOOKED_COLOR}
                                                                        />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip
                                                                    formatter={(value, name) => [
                                                                        `${value}%`,
                                                                        name
                                                                    ]}
                                                                    contentStyle={{
                                                                        borderRadius: '8px',
                                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                                        border: 'none',
                                                                        padding: '8px 12px'
                                                                    }}
                                                                />
                                                                <Legend
                                                                    layout="vertical"
                                                                    verticalAlign="middle"
                                                                    align="right"
                                                                    iconType="circle"
                                                                    iconSize={10}
                                                                    formatter={(value, entry, index) => (
                                                                        <span style={{ color: '#333', fontSize: '14px', marginLeft: '4px' }}>{value}</span>
                                                                    )}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Tab.Container>
                        </>
                    )}
                </Container>
            </div>
            <ToastContainer position="bottom-end" className="p-3">
                <Toast
                    show={showAppointmentToast}
                    onClose={() => setShowAppointmentToast(false)}
                    delay={5000}
                    autohide
                >
                    <Toast.Header>
                        <i className="bx bx-bell me-2 text-primary"></i>
                        <strong className="me-auto">
                            {appointmentStatus.hasCurrentAppointment
                                ? t('current_appointment') || 'Current Appointment'
                                : t('upcoming_appointment') || 'Upcoming Appointment'}
                        </strong>
                        <small>
                            {appointmentStatus.hasCurrentAppointment && appointmentStatus.currentAppointment
                                ? `${appointmentStatus.currentAppointment.remainingMinutes.toFixed(0)} ${t('min_remaining') || 'min remaining'}`
                                : appointmentStatus.hasUpcomingAppointment && appointmentStatus.upcomingAppointment
                                    ? `${t('in') || 'in'} ${appointmentStatus.upcomingAppointment.minutesUntil.toFixed(0)} ${t('minutes') || 'minutes'}`
                                    : ''}
                        </small>
                    </Toast.Header>
                    <Toast.Body>
                        {appointmentStatus.hasCurrentAppointment && appointmentStatus.currentAppointment
                            ? `${t('you_are_currently_with') || 'You are currently with'} ${appointmentStatus.currentAppointment.clientName}`
                            : appointmentStatus.hasUpcomingAppointment && appointmentStatus.upcomingAppointment
                                ? `${t('you_have_upcoming_appointment_with') || 'You have an upcoming appointment with'} ${appointmentStatus.upcomingAppointment.clientName}`
                                : ''}
                    </Toast.Body>
                </Toast>
            </ToastContainer>

        </React.Fragment>
    );
};

export default withRouter(withTranslation()(Dashboard));