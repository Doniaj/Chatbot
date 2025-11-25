import React, {useEffect, useMemo, useState} from 'react';
import {Button, Card, Col, Container, Dropdown, Row} from 'react-bootstrap';
import Breadcrumb from 'Common/BreadCrumb';
import TableContainer from "Common/TableContainer";
import {NotifyError} from "../../../util/alerte_extensions/AlertsComponents";
import moment from "moment";
import {NotifyInfo, NotifySuccess} from "../../../Common/Toast";
import 'assets/scss/components/skeleton/_categories.css'
import 'assets/scss/components/skeleton/_loading.css'
import {GetUserInfo, PhoneNumbers} from "../../../helpers/stringHelper";
import ConfirmModal from "../../../util/modals/ConfirmModal";
import {useNavigate} from "react-router-dom";
import SkeletonTable from "../../../helpers/skeletonTable";
import withRouter from "../../../Common/withRouter";
import {withTranslation} from "react-i18next";
import clientApiService from "../../../util/services/ClientsApiService";
import usersApiService from "../../../util/services/UsersApiService";
import workflowApiService from "../../../util/services/WorkFlowApiService";

const ClientsList = (props: any) => {
    document.title = props.t('list-clients');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [metaKey, setMetaKey] = useState<string>("");
    const [clients, setClients] = useState<any[]>([]);
    const [blockClientAction, setBlockClientAction] = useState<boolean>(false);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [toggleModalDelete, setToggleModalDelete] = useState<boolean>(false);
    const [dataModalDelete, setDataModalDelete] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [pages, setPages] = useState<number>(0);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const currentUser = GetUserInfo();
    const navigate = useNavigate();

    useEffect(() => {
        usersApiService.getCurrentUser()
            .then(response => {
                if (response.data && response.data.user) {
                    const userId = response.data.user.user_id;
                    setCurrentUserId(userId);
                } else {
                    NotifyError(props.t('fail-fetch-user'));
                }
            })
            .catch(() => NotifyError(props.t('fail-fetch-user')));
    }, []);

    useEffect(() => {
        if (currentUserId) {
            getAllClients(metaKey, currentPage + 1, rowsPerPage);
        }
    }, [currentUserId]);

    const searchClient = (ele: any) => {
        let search = ele.target.value.trim();
        let metaKey = search.length >= 3 ? search.toLowerCase() : '';
        setMetaKey(metaKey);
    };

    const getAllClients = (_meta_key: string, _currentPage: any, _rowsPerPage: any) => {
        if (!currentUserId) return;

        setIsLoading(true);

        // Create a filter params string for findClients
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
            limit: 1000,
            offset: 0
        });

        clientApiService.findClients(filterParams)
            .then(response => {
                const allClients = response.data?.data || [];
                const adminClients = allClients.filter((client: any) => client.admin_id === currentUserId);
                let filteredClients = adminClients;
                if (_meta_key) {
                    filteredClients = adminClients.filter((client: any) =>
                        client.first_name?.toLowerCase().includes(_meta_key) ||
                        client.last_name?.toLowerCase().includes(_meta_key) ||
                        `${client.first_name} ${client.last_name}`.toLowerCase().includes(_meta_key) ||
                        client.phone_number?.includes(_meta_key)
                    );
                }

                const totalPages = Math.ceil(filteredClients.length / _rowsPerPage);
                const startIndex = (_currentPage - 1) * _rowsPerPage;
                const paginatedClients = filteredClients.slice(startIndex, startIndex + _rowsPerPage);

                setClients(paginatedClients);
                setPages(totalPages);
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
                NotifyError(props.t('fail-catch'));
            });
    };

    const deleteClient = (values: any) => {
        setToggleModalDelete(true);
        setDataModalDelete({
            id: values?.id,
            fullname: `${values?.first_name} ${values?.last_name}`
        });
    };

    const confirmDeleteClient = () => {
        if (!dataModalDelete?.id) return;

        setBlockClientAction(true);

        const clientData = {
            id: dataModalDelete.id,
            active: 'N',
            updated_at: moment(new Date()).format()
        };

        console.log("Deactivating client with ID:", dataModalDelete.id);

        clientApiService.updateClient(clientData)
            .then(response => {
                console.log("Complete deactivate response:", response);

                setClients(prevClients =>
                    prevClients.filter(client => client.id !== dataModalDelete.id)
                );

                setToggleModalDelete(false);

                getAllClients(metaKey, 1, rowsPerPage);

                NotifySuccess(props.t('client-deleted'));

            })
            .catch(error => {
                console.error("Deactivate error:", error);
                NotifyError(props.t('fail-catch'));
            })
            .finally(() => {
                setBlockClientAction(false);
                setDataModalDelete(null);
            });
    };

    const cancelDeleteClient = () => {
        setToggleModalDelete(false);
        setDataModalDelete(null);
    };

    const handlePagination = (_page: any) => {
        let _currentPage = _page.selected;
        setCurrentPage(_currentPage);
        getAllClients(metaKey, _currentPage + 1, rowsPerPage);
    };

    const handlePerPage = (e: any) => {
        setRowsPerPage(parseInt(e));
        setCurrentPage(0);
        getAllClients(metaKey, 1, e);
    };

    const navigateToEditClient = (client: any) => {
        console.log("Navigating to edit client with data:", client);
        navigate('/client-management/editClient', {
            state: {
                client: client, // <-- client.id = 7
                clientWorkflow: true
            }
        });

    };


    const columns = useMemo(
        () => [
            {
                Header: props.t('fullname'),
                Filter: false,
                accessor: (cellProps: any) => {
                    return (<div className="d-flex align-items-center gap-2">
                        <div className="user_name">{`${cellProps?.first_name} ${cellProps?.last_name}`}</div>
                    </div>)
                }
            },
            {
                Header: props.t('create-date'),
                accessor: (cellProps: any) => {
                    return <div>{moment(cellProps?.created_at).format('ll')}</div>
                },
                Filter: false
            },
            {
                Header: props.t('phone-number'),
                Filter: false,
                accessor: (cellProps: any) => {
                    // Use the PhoneNumbers helper function for consistency with AdminsList
                    const data = PhoneNumbers(cellProps);
                    if (data) {
                        try {
                            const flagImageSrc = require(`assets/images/flags/${data?.abv}.svg`);
                            return (<div><img width={20} src={flagImageSrc} alt={data?.name}/> {data?.dialCode}{data?.phone_number}</div>);
                        } catch (error) {
                            return <div>{data?.dialCode}{data?.phone_number}</div>;
                        }
                    }
                    return cellProps?.phone_number ? <div>{cellProps?.phone_number}</div> : null;
                },
            },
            {
                Header: props.t('action'),
                Filter: false,
                Cell: (cellProps: any) => {
                    return (
                        <React.Fragment>
                            <Dropdown className="text-start">
                                <Dropdown.Toggle className="btn btn-soft-secondary btn-sm btn-icon dropdown arrow-none">
                                    <i className="mdi mdi-dots-horizontal"/>
                                </Dropdown.Toggle>
                                <Dropdown.Menu as="ul" className="dropdown-menu-start">
                                    <li onClick={() => {
                                        navigate('/user-management/clientDetails', {
                                            state: {
                                                client: cellProps?.row?.original
                                            }
                                        })
                                    }}>
                                        <Dropdown.Item>
                                            <i className="ri-file-list-3-line align-bottom me-2 text-muted"/> {props.t('details')}
                                        </Dropdown.Item>
                                    </li>
                                    <li onClick={() => {
                                        navigate('/user-management/editClient', {
                                            state: {
                                                client: cellProps?.row?.original
                                            }
                                        })
                                    }}>
                                        <Dropdown.Item>
                                            <i className="ri-pencil-fill align-bottom me-2 text-muted"/> {props.t('edit')}
                                        </Dropdown.Item>
                                    </li>

                                    <li onClick={() => {
                                        deleteClient(cellProps?.row?.original)
                                    }}>
                                        <Dropdown.Item className="remove-list">
                                            <i className="ri-delete-bin-fill align-bottom me-2 text-muted"/>{props.t('delete')}
                                        </Dropdown.Item>
                                    </li>
                                    <li onClick={() => {
                                        navigate('/user-management/appointments', {
                                            state: {
                                                client: cellProps?.row?.original
                                            }
                                        });
                                    }}>
                                        <Dropdown.Item>
                                            <i className="ri-calendar-fill align-bottom me-2 text-muted"/> {props.t('appointments')}
                                        </Dropdown.Item>
                                    </li>
                                </Dropdown.Menu>
                            </Dropdown>
                        </React.Fragment>
                    );
                },
            }
        ],
        []
    );

    return (
        <React.Fragment>
            {toggleModalDelete ?
                <ConfirmModal
                    message={props.t('confirm-delete-client')}
                    handleModal={toggleModalDelete}
                    onConfirm={confirmDeleteClient}
                    onCancel={cancelDeleteClient}
                    block={blockClientAction}
                    textConfirm={props.t('delete')}
                    blockText={props.t('deleting...')}
                ></ConfirmModal> : null}
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumb title={'list-clients'} ParentTitle={'list-clients'} props={props}/>
                    <Row id="clientsList">
                        <Col lg={12}>
                            <Card>
                                <Card.Body>
                                    <Row className="g-lg-2 g-4">
                                        <Col sm={3}>
                                            <div className="search-box">
                                                <input type="text" className="form-control search"
                                                       placeholder={props.t('search...')}
                                                       onChange={(e) => searchClient(e)}/>
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </Col>
                                        <Col sm={3} className="">
                                            <Button onClick={() => getAllClients(metaKey, 1, rowsPerPage)}
                                                    variant='primary'
                                                    type="button"
                                                    className="add-btn">{props.t('search')}
                                            </Button>
                                        </Col>
                                        <Col sm={3} className="col-lg-auto ms-auto">
                                            <Button onClick={() => {
                                                navigate('/user-management/addClient');
                                            }} variant='primary' type="button"
                                                    className="w-100 add-btn">
                                                {props.t('add-client')}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                            <Card>
                                <Card.Body>
                                    <div>
                                        {isLoading ? <SkeletonTable numberOfRows={5}/> : <>
                                            {clients && clients.length !== 0 ? <TableContainer
                                                    columns={(columns || [])}
                                                    data={(clients || [])}
                                                    handlePerPageChanged={handlePerPage}
                                                    iscustomPageSize={true}
                                                    isBordered={false}
                                                    customPageSize={rowsPerPage}
                                                    className="custom-header-css table align-middle table-nowrap"
                                                    tableClassName="table-centered align-middle table-nowrap mb-0"
                                                    theadClassName="text-muted table-light"
                                                    SearchPlaceholder='Search Clients...'
                                                    handlePagination={handlePagination}
                                                    pages={pages}
                                                    currentPage={currentPage}
                                                /> :
                                                <div className="text-center">
                                                    <h5 className="mt-2">{props.t('no-result-found')}</h5>
                                                </div>}

                                        </>}
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

export default withRouter(withTranslation()(ClientsList));