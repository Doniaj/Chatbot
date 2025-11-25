import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Container, Row, Badge, Modal } from 'react-bootstrap';
import Breadcrumb from 'Common/BreadCrumb';
import TableContainer from "Common/TableContainer";
import { NotifyError } from "../../../util/alerte_extensions/AlertsComponents";
import moment from "moment";
import { NotifySuccess } from "../../../Common/Toast";
import { useLocation, useNavigate } from "react-router-dom";
import SkeletonTable from "../../../helpers/skeletonTable";
import withRouter from "../../../Common/withRouter";
import { withTranslation } from "react-i18next";
import ConfirmModal from "../../../util/modals/ConfirmModal";
import availabilityApiService from "../../../util/services/AvailabilityApiService";
import UpdateEventModal from "../../../Components/Admin/Disponibilité/UpdateEventModal";
import AddEventModal from "../../../Components/Admin/Disponibilité/AddEventModal";

// Define types for the component
interface ClientType {
    id: number;
    first_name: string;
    last_name: string;
}

interface AppointmentType {
    id: number;
    client_id: number;
    user_id: number;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    type: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

interface DeleteModalDataType {
    id: number;
    appointmentDate: string;
}

interface LocationStateType {
    client: ClientType;
}

interface ToggleStatusModalDataType {
    id: number;
    currentStatus: string;
    appointmentDate: string;
}

interface NotesModalDataType {
    title: string;
    content: string;
}

const AppointmentsPage = (props: any) => {
    const { t } = props;
    document.title = t('client-appointments') || 'Client Appointments';

    const location = useLocation();
    const navigate = useNavigate();
    const [client, setClient] = useState<ClientType | null>(null);
    const [allAppointments, setAllAppointments] = useState<AppointmentType[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [toggleModalDelete, setToggleModalDelete] = useState<boolean>(false);
    const [dataModalDelete, setDataModalDelete] = useState<DeleteModalDataType | null>(null);
    const [toggleStatusModal, setToggleStatusModal] = useState<boolean>(false);
    const [statusModalData, setStatusModalData] = useState<ToggleStatusModalDataType | null>(null);
    const [blockAction, setBlockAction] = useState<boolean>(false);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [pages, setPages] = useState<number>(0);

    // State for update modal
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentType | null>(null);

    // State for add modal
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    // State for notes display modal
    const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
    const [notesModalData, setNotesModalData] = useState<NotesModalDataType>({ title: '', content: '' });

    useEffect(() => {
        const state = location.state as LocationStateType;
        if (state && state.client) {
            setClient(state.client);
            fetchAppointments(state.client.id);
        } else {
            navigate('/user-management/clients');
        }
    }, [location]);

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
                setPages(Math.ceil(filteredAppointments.length / rowsPerPage));
            } else {
                setAllAppointments([]);
                setPages(0);
            }
        } catch (error) {
            NotifyError(t('fail-fetch-appointments') || 'Failed to fetch appointments');
        } finally {
            setIsLoading(false);
        }
    };

    // Get paginated appointments
    const getPaginatedAppointments = () => {
        const startIndex = currentPage * rowsPerPage;
        return allAppointments.slice(startIndex, startIndex + rowsPerPage);
    };

    const deleteAppointment = (values: AppointmentType) => {
        setToggleModalDelete(true);
        setDataModalDelete({
            id: values.id,
            appointmentDate: values.appointment_date
        });
    };

    const confirmDeleteAppointment = async () => {
        if (dataModalDelete?.id) {
            setBlockAction(true);
            try {
                const response = await availabilityApiService.deleteAvailability(dataModalDelete.id.toString());

                if (response?.data?.success) {
                    setBlockAction(false);
                    setToggleModalDelete(false);
                    if (client) {
                        fetchAppointments(client.id);
                    }
                    NotifySuccess(t('appointment-deleted') || 'Appointment deleted successfully');
                } else {
                    setBlockAction(false);
                    NotifyError(response?.data?.message || t('delete-failed') || 'Failed to delete appointment');
                }
            } catch (error) {
                setBlockAction(false);
                NotifyError(t('fail-catch') || 'An error occurred. Please try again.');
            }
        }
    };

    const cancelDeleteAppointment = () => {
        setToggleModalDelete(false);
        setDataModalDelete(null);
    };

    const toggleAppointmentStatus = (appointment: AppointmentType) => {
        setToggleStatusModal(true);
        setStatusModalData({
            id: appointment.id,
            currentStatus: appointment.status,
            appointmentDate: appointment.appointment_date
        });
    };

    const confirmToggleStatus = async () => {
        if (statusModalData?.id) {
            setBlockAction(true);
            try {
                const newStatus = statusModalData.currentStatus === 'Y' ? 'N' : 'Y';

                const response = await availabilityApiService.updateAvailability({
                    id: statusModalData.id,
                    status: newStatus
                });

                if (response?.data?.success) {
                    setBlockAction(false);
                    setToggleStatusModal(false);
                    if (client) {
                        fetchAppointments(client.id);
                    }
                    NotifySuccess(
                        newStatus === 'Y'
                            ? (t('appointment-marked-treated') || 'Appointment marked as treated')
                            : (t('appointment-marked-not-treated') || 'Appointment marked as not treated')
                    );
                } else {
                    setBlockAction(false);
                    NotifyError(response?.data?.message || t('update-failed') || 'Failed to update appointment');
                }
            } catch (error) {
                setBlockAction(false);
                NotifyError(t('fail-catch') || 'An error occurred. Please try again.');
            }
        }
    };

    const cancelToggleStatus = () => {
        setToggleStatusModal(false);
        setStatusModalData(null);
    };

    const handlePagination = (_page: { selected: number }) => {
        setCurrentPage(_page.selected);
    };

    // Modified to open the add appointment modal directly
    const handleAddAppointment = () => {
        setSelectedDate(new Date());
        setIsAddModalOpen(true);
    };

    const handleAddModalClose = () => {
        setIsAddModalOpen(false);
    };

    const handleAddSuccess = () => {
        if (client) {
            fetchAppointments(client.id);
        }
    };

    // Updated to open the update modal instead of navigating
    const handleEditAppointment = (appointment: AppointmentType) => {
        // Make a copy of the original appointment and add availability_id
        // This maintains all fields including id while adding the field needed by UpdateEventModal
        const formattedAppointment = {
            ...appointment,
            availability_id: appointment.id
        };

        setSelectedAppointment(formattedAppointment);
        setIsUpdateModalOpen(true);
    };

    const handleUpdateModalClose = () => {
        setIsUpdateModalOpen(false);
        setSelectedAppointment(null);
    };

    const handleUpdateSuccess = () => {
        if (client) {
            fetchAppointments(client.id);
        }
    };

    // Updated to show notes in a modal instead of an alert
    const viewNotes = (appointment: AppointmentType) => {
        const appointmentDate = moment(appointment.appointment_date).format('ll');
        const startTime = moment(appointment.start_time, 'HH:mm:ss').format('LT');
        const title = `${t('notes-for') || 'Notes for'} ${appointmentDate} ${t('at') || 'at'} ${startTime}`;

        setNotesModalData({
            title: title,
            content: appointment.notes || (t('no-notes-available') || 'No notes available for this appointment')
        });

        setShowNotesModal(true);
    };

    const closeNotesModal = () => {
        setShowNotesModal(false);
    };

    const columns = useMemo(
        () => [
            {
                Header: t('appointment-date') || 'Appointment Date',
                accessor: (cellProps: AppointmentType) => {
                    return <div>{moment(cellProps.appointment_date).format('ll')}</div>;
                },
                Filter: false
            },
            {
                Header: t('start-time') || 'Start Time',
                accessor: (cellProps: AppointmentType) => {
                    return <div>{moment(cellProps.start_time, 'HH:mm:ss').format('LT')}</div>;
                },
                Filter: false
            },
            {
                Header: t('end-time') || 'End Time',
                accessor: (cellProps: AppointmentType) => {
                    return <div>{moment(cellProps.end_time, 'HH:mm:ss').format('LT')}</div>;
                },
                Filter: false
            },
            {
                Header: t('status') || 'Status',
                accessor: (cellProps: AppointmentType) => {
                    return (
                        <div className="d-flex align-items-center">
                            <Badge
                                bg={cellProps.status === 'Y' ? 'success' : 'danger'}
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleAppointmentStatus(cellProps)}
                                title={cellProps.status === 'Y' ?
                                    (t('confirm-mark-appointment-not-treated') || 'Click to mark as not treated') :
                                    (t('confirm-mark-appointment-treated') || 'Click to mark as treated')
                                }
                            >
                                {cellProps.status === 'Y' ?
                                    (t('treated') || 'Treated') :
                                    (t('not-treated') || 'Not Treated')
                                }
                            </Badge>
                        </div>
                    );
                },
                Filter: false
            },
            {
                Header: t('notes') || 'Notes',
                accessor: (cellProps: AppointmentType) => {
                    return (
                        <div className="d-flex align-items-center">
                            <Button
                                size="sm"
                                variant={cellProps.notes ? "info" : "outline-info"}
                                disabled={!cellProps.notes}
                                onClick={() => viewNotes(cellProps)}
                                title={cellProps.notes ?
                                    (t('view-appointment-notes') || 'View appointment notes') :
                                    (t('no-notes-available') || 'No notes available')
                                }
                            >
                                <i className="ri-file-text-line"></i>
                            </Button>
                        </div>
                    );
                },
                Filter: false
            },
            {
                Header: t('created-at') || 'Created At',
                accessor: (cellProps: AppointmentType) => {
                    return <div>{moment(cellProps.created_at).format('ll')}</div>;
                },
                Filter: false
            },
            {
                Header: t('action') || 'Action',
                Filter: false,
                Cell: (cellProps: { row: { original: AppointmentType } }) => {
                    return (
                        <React.Fragment>
                            <Button
                                className="btn btn-sm btn-soft-info me-2"
                                onClick={() => handleEditAppointment(cellProps.row.original)}
                                title={t('edit') || 'Edit appointment'}
                            >
                                <i className="ri-pencil-fill"></i>
                            </Button>
                            <Button
                                className="btn btn-sm btn-soft-danger"
                                onClick={() => deleteAppointment(cellProps.row.original)}
                                title={t('delete') || 'Delete appointment'}
                            >
                                <i className="ri-delete-bin-fill"></i>
                            </Button>
                        </React.Fragment>
                    );
                },
            }
        ],
        [t]
    );

    const handlePerPage = (e: string) => {
        const newRowsPerPage = parseInt(e);
        setRowsPerPage(newRowsPerPage);
        setPages(Math.ceil(allAppointments.length / newRowsPerPage));
        setCurrentPage(0);
    };

    // Get the current page appointments
    const paginatedAppointments = getPaginatedAppointments();

    // Custom AddEventModal implementation for client appointments
    const CustomAddEventModal = () => {
        // Use type assertion to handle potential null
        const clientProp = client ?
            {
                id: client.id,
                first_name: client.first_name,
                last_name: client.last_name
            } :
            undefined;

        return (
            <AddEventModal
                isOpen={isAddModalOpen}
                onClose={handleAddModalClose}
                onSuccess={handleAddSuccess}
                selectedDate={selectedDate}
                currentClient={clientProp}
                appointmentOnly={true}
            />
        );
    };

    return (
        <React.Fragment>
            {toggleModalDelete ? (
                <ConfirmModal
                    message={t('confirm-delete-appointment') || 'Are you sure you want to delete this appointment?'}
                    handleModal={toggleModalDelete}
                    onConfirm={confirmDeleteAppointment}
                    onCancel={cancelDeleteAppointment}
                    block={blockAction}
                    textConfirm={t('delete') || 'Delete'}
                    blockText={t('deleting...') || 'Deleting...'}
                />
            ) : null}

            {toggleStatusModal ? (
                <ConfirmModal
                    message={
                        statusModalData?.currentStatus === 'Y'
                            ? (t('confirm-mark-appointment-not-treated') || 'Are you sure you want to mark this appointment as not treated?')
                            : (t('confirm-mark-appointment-treated') || 'Are you sure you want to mark this appointment as treated?')
                    }
                    handleModal={toggleStatusModal}
                    onConfirm={confirmToggleStatus}
                    onCancel={cancelToggleStatus}
                    block={blockAction}
                    textConfirm={statusModalData?.currentStatus === 'Y' ?
                        (t('mark-not-treated') || 'Mark Not Treated') :
                        (t('mark-treated') || 'Mark Treated')
                    }
                    blockText={t('updating...') || 'Updating...'}
                />
            ) : null}

            {isUpdateModalOpen && selectedAppointment && (
                <UpdateEventModal
                    isOpen={isUpdateModalOpen}
                    onClose={handleUpdateModalClose}
                    onSuccess={handleUpdateSuccess}
                    eventData={selectedAppointment}
                    currentClient={client ? {
                        id: client.id,
                        first_name: client.first_name,
                        last_name: client.last_name
                    } : undefined}
                    appointmentOnly={true}
                />
            )}

            {/* Custom Add Event Modal */}
            {isAddModalOpen && <CustomAddEventModal />}

            {/* Notes View Modal */}
            <Modal
                show={showNotesModal}
                onHide={closeNotesModal}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-file-text-line me-2"></i>
                        {notesModalData.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div
                        className="p-3 bg-light rounded"
                        style={{
                            whiteSpace: 'pre-wrap',
                            minHeight: '100px',
                            maxHeight: '400px',
                            overflowY: 'auto'
                        }}
                    >
                        {notesModalData.content}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeNotesModal}>
                        <i className="ri-close-line me-1"></i>
                        {t('close') || 'Close'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumb
                        title={t('client-appointments') || 'Client Appointments'}
                        ParentTitle={t('appointments') || 'Appointments'}
                        props={props}
                    />
                    <Row>
                        <Col lg={12}>
                            <Card className="mb-4">
                                <Card.Body>
                                    <Row className="align-items-center">
                                        <Col sm={8}>
                                            {client && (
                                                <h5>
                                                    {t('appointments-for') || 'Appointments for'}: {client.first_name} {client.last_name}
                                                </h5>
                                            )}
                                        </Col>
                                        <Col sm={4} className="text-end">
                                            <Button variant="primary" onClick={handleAddAppointment}>
                                                <i className="ri-add-line me-1"></i>
                                                {t('add-appointment') || 'Add Appointment'}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                            <Card>
                                <Card.Body>
                                    <div>
                                        {isLoading ? (
                                            <SkeletonTable numberOfRows={5} />
                                        ) : (
                                            <>
                                                {allAppointments && allAppointments.length > 0 ? (
                                                    <TableContainer
                                                        columns={columns}
                                                        data={paginatedAppointments}
                                                        handlePerPageChanged={handlePerPage}
                                                        iscustomPageSize={true}
                                                        isBordered={false}
                                                        customPageSize={rowsPerPage}
                                                        className="custom-header-css table align-middle table-nowrap"
                                                        tableClassName="table-centered align-middle table-nowrap mb-0"
                                                        theadClassName="text-muted table-light"
                                                        SearchPlaceholder=""
                                                        handlePagination={handlePagination}
                                                        pages={pages}
                                                        currentPage={currentPage}
                                                    />
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

                                                        <Button variant="primary" onClick={handleAddAppointment}>
                                                            <i className="ri-add-line me-1"></i>
                                                            {t('add-appointment') || 'Add Appointment'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default withRouter(withTranslation()(AppointmentsPage));