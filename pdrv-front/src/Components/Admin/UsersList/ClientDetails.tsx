import React, { useEffect, useState } from 'react';
import { Card, Col, Container, Row, Badge, Button, Pagination } from 'react-bootstrap';
import Breadcrumb from 'Common/BreadCrumb';
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import withRouter from "../../../Common/withRouter";
import { withTranslation } from "react-i18next";
import { NotifyError } from "../../../util/alerte_extensions/AlertsComponents";
import availabilityApiService from "../../../util/services/AvailabilityApiService";
import {PhoneNumbers} from "../../../helpers/stringHelper";
import {abreviationCountryDialCode} from "../../../helpers/countryDialCodeHelper";
import SkeletonTable from "../../../helpers/skeletonTable";

interface ClientType {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    country_code?: string;
    created_at: string;
    updated_at: string;
    birthday?: string | null;
    insurance_id?: string | null;
    [key: string]: any; // For other possible properties
}

interface AppointmentType {
    id: number;
    client_id: number;
    user_id: number;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    notes?: string;
    type: string;
    created_at: string;
    updated_at: string;
}

interface LocationStateType {
    client: ClientType;
}

const ClientDetails = (props: any) => {
    const { t } = props;
    document.title = t('client-details') || 'Client Details';

    const location = useLocation();
    const navigate = useNavigate();
    const [client, setClient] = useState<ClientType | null>(null);
    const [allAppointments, setAllAppointments] = useState<AppointmentType[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [viewNoteId, setViewNoteId] = useState<number | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [appointmentsPerPage] = useState<number>(3);
    const [totalPages, setTotalPages] = useState<number>(0);

    useEffect(() => {
        const state = location.state as LocationStateType;
        if (state && state.client) {
            setClient(state.client);
            fetchAppointments(state.client.id);
        } else {
            navigate('/user-management/clients');
        }
    }, [location]);

    // Update pagination when appointments change
    useEffect(() => {
        setTotalPages(Math.ceil(allAppointments.length / appointmentsPerPage));
    }, [allAppointments, appointmentsPerPage]);

    const fetchAppointments = async (clientId: number) => {
        setIsLoading(true);
        try {
            const params = `client_id=${clientId}&type=appointment`;
            const response = await availabilityApiService.findAvailability(params);

            if (response?.data?.data) {
                const appointmentsData = response.data.data || [];

                const filteredAppointments = appointmentsData.filter(
                    (appointment: AppointmentType) => appointment.client_id === clientId
                );

                // Sort appointments by date (newest first)
                filteredAppointments.sort((a: AppointmentType, b: AppointmentType) => {
                    return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
                });

                setAllAppointments(filteredAppointments);
                setTotalPages(Math.ceil(filteredAppointments.length / appointmentsPerPage));
            } else {
                setAllAppointments([]);
                setTotalPages(0);
            }
        } catch (error) {
            NotifyError(t('fail-fetch-appointments') || 'Failed to fetch appointments');
        } finally {
            setIsLoading(false);
        }
    };

    // Get current page appointments
    const getCurrentAppointments = () => {
        const startIndex = currentPage * appointmentsPerPage;
        return allAppointments.slice(startIndex, startIndex + appointmentsPerPage);
    };

    const formatPhoneNumber = (client: ClientType) => {
        if (client?.phone_number) {
            if (client?.country_code) {
                try {
                    const countryAbbr = client?.country_code ? abreviationCountryDialCode(client.country_code) : 'unknown';
                    const flagImageSrc = require(`assets/images/flags/${countryAbbr}.svg`);
                    return (
                        <div className="d-flex align-items-center">
                            <img width={20} src={flagImageSrc} alt={client?.country || countryAbbr} className="me-2"/>
                            <span className="fs-5">+{client?.country_code} {client?.phone_number}</span>
                        </div>
                    );
                } catch (error) {
                    return <span className="fs-5">+{client?.country_code} {client?.phone_number}</span>;
                }
            } else {
                const data = PhoneNumbers(client);
                if (data) {
                    try {
                        const flagImageSrc = require(`assets/images/flags/${data?.abv}.svg`);
                        return (
                            <div className="d-flex align-items-center">
                                <img width={20} src={flagImageSrc} alt={data?.name} className="me-2"/>
                                <span className="fs-5">{data?.dialCode} {data?.phone_number}</span>
                            </div>
                        );
                    } catch (error) {
                        return <span className="fs-5">{data?.dialCode} {data?.phone_number}</span>;
                    }
                }
            }
            return <span className="fs-5">{client?.phone_number}</span>;
        }
        return <span className="text-muted fst-italic">{t('not-available') || 'Not Available'}</span>;
    };

    const goBack = () => {
        navigate(-1);
    };

    const navigateToAppointments = () => {
        if (client) {
            navigate('/user-management/appointments', {
                state: {
                    client: client
                }
            });
        }
    };

    const toggleViewNote = (appointmentId: number) => {
        if (viewNoteId === appointmentId) {
            setViewNoteId(null);
        } else {
            setViewNoteId(appointmentId);
        }
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const renderAppointmentStatus = (status: string) => {
        if (status === 'Y') {
            return (
                <Badge bg="success" className="px-3 py-2">
                    <i className="ri-checkbox-circle-line me-1"></i>
                    {t('treated') || 'Treated'}
                </Badge>
            );
        } else {
            return (
                <Badge bg="danger" className="px-3 py-2">
                    <i className="ri-close-circle-line me-1"></i>
                    {t('not-treated') || 'Not Treated'}
                </Badge>
            );
        }
    };

    // Helper function to get translated field names for dynamic client properties
    const getTranslatedFieldName = (key: string): string => {
        // Map of common field names to translation keys
        const fieldTranslations: { [key: string]: string } = {
            'email': 'email',
            'address': 'address',
            'city': 'city',
            'country': 'country',
            'postal_code': 'postal_code',
            'emergency_contact': 'emergency_contact',
            'occupation': 'occupation',
            'medical_history': 'medical_history',
            'allergies': 'allergies'
        };

        const translationKey = fieldTranslations[key] || key;
        const translated = t(translationKey);

        // If translation returns the same key, format it nicely
        if (translated === translationKey) {
            return key.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }

        return translated;
    };

    // Get the paginated appointments
    const paginatedAppointments = getCurrentAppointments();

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumb
                        title={t('client-details') || 'Client Details'}
                        ParentTitle={t('clients') || 'Clients'}
                        props={props}
                    />

                    {client && (
                        <Row>
                            <Col lg={4}>
                                <Card className="shadow-sm">
                                    <Card.Header className="bg-soft-primary">
                                        <h5 className="card-title mb-0">
                                            {t('client-information') || 'Client Information'}
                                        </h5>
                                    </Card.Header>
                                    <Card.Body className="p-4">
                                        <div className="text-center mb-4">
                                            <div className=" justify-content-center mx-auto mb-4">
                                                <div className="avatar-title bg-soft-primary rounded-circle fs-2">
                                                    <i className="ri-contacts-line"></i>
                                                </div>
                                            </div>
                                            <h4 className="mb-0">{client.first_name} {client.last_name}</h4>
                                            <div className="mt-3 d-flex justify-content-center">
                                                {formatPhoneNumber(client)}
                                            </div>
                                        </div>

                                        <hr className="mb-4" />

                                        <div className="pt-2">
                                            <Row className="align-items-center mb-3">
                                                <Col xs={5}>
                                                    <div className="text-muted">
                                                        {t('created-on') || 'Created On'}:
                                                    </div>
                                                </Col>
                                                <Col xs={7}>
                                                    <div className="fw-medium text-end">
                                                        {moment(client.created_at).format('MMMM D, YYYY')}
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row className="align-items-center mb-3">
                                                <Col xs={5}>
                                                    <div className="text-muted">
                                                        {t('last-updated') || 'Last Updated'}:
                                                    </div>
                                                </Col>
                                                <Col xs={7}>
                                                    <div className="fw-medium text-end">
                                                        {moment(client.updated_at).format('MMMM D, YYYY')}
                                                    </div>
                                                </Col>
                                            </Row>

                                            {/* Render birthday and insurance_id separately with translations */}
                                            {client.birthday && (
                                                <Row className="align-items-center mb-3">
                                                    <Col xs={5}>
                                                        <div className="text-muted">
                                                            {t('birthday') || 'Birthday'}:
                                                        </div>
                                                    </Col>
                                                    <Col xs={7}>
                                                        <div className="fw-medium text-end">
                                                            {moment(client.birthday).format('MMMM D, YYYY')}
                                                        </div>
                                                    </Col>
                                                </Row>
                                            )}
                                            {client.insurance_id && (
                                                <Row className="align-items-center mb-3">
                                                    <Col xs={5}>
                                                        <div className="text-muted">
                                                            {t('insurance-id') || 'Insurance ID'}:
                                                        </div>
                                                    </Col>
                                                    <Col xs={7}>
                                                        <div className="fw-medium text-end">{client.insurance_id}</div>
                                                    </Col>
                                                </Row>
                                            )}

                                            {Object.entries(client).map(([key, value]) => {
                                                // Skip properties we already display or that should be excluded
                                                const skipProperties = ['id', 'first_name', 'last_name', 'phone_number', 'country_code',
                                                    'created_at', 'updated_at', 'status', 'user_id', 'admin_id', 'active',
                                                    'birthday', 'insurance_id'];
                                                if (!skipProperties.includes(key) && value && typeof value !== 'object') {
                                                    return (
                                                        <Row className="align-items-center mb-3" key={key}>
                                                            <Col xs={5}>
                                                                <div className="text-muted">
                                                                    {getTranslatedFieldName(key)}:
                                                                </div>
                                                            </Col>
                                                            <Col xs={7}>
                                                                <div className="fw-medium text-end">{value.toString()}</div>
                                                            </Col>
                                                        </Row>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <div className="mt-4 pt-3">
                                            <Button
                                                variant="primary"
                                                className="w-100 mb-3"
                                                onClick={navigateToAppointments}
                                            >
                                                <i className="ri-calendar-line align-middle me-1"></i>
                                                {t('manage-appointments') || 'Manage Appointments'}
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                className="w-100"
                                                onClick={goBack}
                                            >
                                                <i className="ri-arrow-left-line align-middle me-1"></i>
                                                {t('back') || 'Back'}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={8}>
                                <Card className="shadow-sm">
                                    <Card.Header className="d-flex align-items-center bg-soft-primary">
                                        <h5 className="card-title mb-0 flex-grow-1">
                                            {t('appointment-history') || 'Appointment History'}
                                        </h5>
                                        {allAppointments.length > 0 && (
                                            <div className="flex-shrink-0">
                                                <span className="badge bg-primary rounded-pill py-2 px-3">
                                                    {allAppointments.length}
                                                </span>
                                            </div>
                                        )}
                                    </Card.Header>
                                    <Card.Body>
                                        {isLoading ? (
                                            <SkeletonTable numberOfRows={3} />
                                        ) : (
                                            <>
                                                {allAppointments.length > 0 ? (
                                                    <>
                                                        <div className="appointment-list">
                                                            {paginatedAppointments.map((appointment) => (
                                                                <div
                                                                    key={appointment.id}
                                                                    className="appointment-item p-3 mb-3 border rounded position-relative"
                                                                    style={{ transition: 'all 0.3s ease' }}
                                                                >
                                                                    <Row>
                                                                        <Col md={3} className="mb-2 mb-md-0">
                                                                            <div className="text-muted small mb-1">
                                                                                {t('date') || 'Date'}
                                                                            </div>
                                                                            <h6 className="mb-0 fw-semibold">
                                                                                <i className="ri-calendar-2-line me-1 text-primary"></i>
                                                                                {moment(appointment.appointment_date).format('DD MMM, YYYY')}
                                                                            </h6>
                                                                        </Col>
                                                                        <Col md={3} className="mb-2 mb-md-0">
                                                                            <div className="text-muted small mb-1">
                                                                                {t('time') || 'Time'}
                                                                            </div>
                                                                            <h6 className="mb-0 fw-semibold">
                                                                                <i className="ri-time-line me-1 text-primary"></i>
                                                                                {moment(appointment.start_time, 'HH:mm:ss').format('h:mm A')} - {moment(appointment.end_time, 'HH:mm:ss').format('h:mm A')}
                                                                            </h6>
                                                                        </Col>
                                                                        <Col md={3} className="mb-2 mb-md-0">
                                                                            <div className="text-muted small mb-1">
                                                                                {t('status') || 'Status'}
                                                                            </div>
                                                                            <div>
                                                                                {renderAppointmentStatus(appointment.status)}
                                                                            </div>
                                                                        </Col>
                                                                        <Col md={3} className="d-flex align-items-end justify-content-md-end">
                                                                            {appointment.notes && (
                                                                                <Button
                                                                                    variant="outline-info"
                                                                                    size="sm"
                                                                                    className="rounded-pill px-3"
                                                                                    onClick={() => toggleViewNote(appointment.id)}
                                                                                >
                                                                                    <i className="ri-file-text-line me-1"></i>
                                                                                    {viewNoteId === appointment.id ?
                                                                                        (t('hide-notes') || 'Hide Notes') :
                                                                                        (t('view-notes') || 'View Notes')
                                                                                    }
                                                                                </Button>
                                                                            )}
                                                                        </Col>
                                                                    </Row>

                                                                    {appointment.notes && viewNoteId === appointment.id && (
                                                                        <div className="mt-3 p-3 bg-light rounded">
                                                                            <h6 className="mb-2 fw-semibold text-primary">
                                                                                <i className="ri-sticky-note-line me-1"></i>
                                                                                {t('notes') || 'Notes'}
                                                                            </h6>
                                                                            <div style={{ whiteSpace: 'pre-wrap' }}>
                                                                                {appointment.notes}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Pagination */}
                                                        {totalPages > 1 && (
                                                            <div className="d-flex justify-content-center mt-4">
                                                                <Pagination className="mb-0">
                                                                    <Pagination.First
                                                                        onClick={() => handlePageChange(0)}
                                                                        disabled={currentPage === 0}
                                                                    />
                                                                    <Pagination.Prev
                                                                        onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                                                                        disabled={currentPage === 0}
                                                                    />

                                                                    {[...Array(totalPages)].map((_, i) => (
                                                                        <Pagination.Item
                                                                            key={i}
                                                                            active={i === currentPage}
                                                                            onClick={() => handlePageChange(i)}
                                                                        >
                                                                            {i + 1}
                                                                        </Pagination.Item>
                                                                    ))}

                                                                    <Pagination.Next
                                                                        onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                                                                        disabled={currentPage === totalPages - 1}
                                                                    />
                                                                    <Pagination.Last
                                                                        onClick={() => handlePageChange(totalPages - 1)}
                                                                        disabled={currentPage === totalPages - 1}
                                                                    />
                                                                </Pagination>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <div className="avatar-lg mx-auto mb-4">
                                                            <div className="avatar-title bg-light text-primary rounded-circle fs-24">
                                                                <i className="ri-calendar-event-line"></i>
                                                            </div>
                                                        </div>
                                                        <h5>{t('no-appointments-found') || 'No Appointments Found'}</h5>
                                                        <p className="text-muted mb-4">
                                                            {t('no-appointments-message') || 'This client doesn\'t have any appointments yet.'}
                                                        </p>

                                                        <Button variant="primary" className="rounded-pill px-4" onClick={navigateToAppointments}>
                                                            <i className="ri-add-line align-bottom me-1"></i>
                                                            {t('add-appointment') || 'Add Appointment'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default withRouter(withTranslation()(ClientDetails));