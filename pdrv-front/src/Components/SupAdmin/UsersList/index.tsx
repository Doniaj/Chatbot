import React, {useEffect, useMemo, useState} from 'react';
import {Button, Card, Col, Container, Dropdown, Row} from 'react-bootstrap';
import Breadcrumb from 'Common/BreadCrumb';
import TableContainer from "Common/TableContainer";
import {NotifyError} from "../../../util/alerte_extensions/AlertsComponents";
import usersApiService from "../../../util/services/UsersApiService";
import moment from "moment";
import {NotifyInfo, NotifySuccess} from "../../../Common/Toast";
import 'assets/scss/components/skeleton/_categories.css'
import 'assets/scss/components/skeleton/_loading.css'
import {GetUserInfo, PhoneNumbers} from "../../../helpers/stringHelper";
import ConfirmModal from "../../../util/modals/ConfirmModal";
import ConfirmModalEnableDisable from "../../../util/modals/ConfirmModal";
import {useNavigate} from "react-router-dom";
import SkeletonTable from "../../../helpers/skeletonTable";
import withRouter from "../../../Common/withRouter";
import {withTranslation} from "react-i18next";

const UsersList = (props: any) => {
    document.title = props.t('list-admins');
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [metaKey, setMetaKey] = useState<string>("")
    const [users, setUsers] = useState<any>([])
    const [blockAddEditUSer, setBlockAddEditUser] = useState<boolean>(false)
    const [rowsPerPage, setRowsPerPage] = useState<any>(10);
    const [toggleModalEnableDisable, setToggleModalEnableDisable] = useState<boolean>(false)
    const [dataModalEnableDisable, setDataModalEnableDisable] = useState<any>(null)
    const [toggleModalDelete, setToggleModalDelete] = useState<boolean>(false)
    const [dataModalDelete, setDataModalDelete] = useState<any>(null)
    const [toggleModalVerify, setToggleModalVerify] = useState<boolean>(false)
    const [dataModalVerify, setDataModalVerify] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState<any>(0);
    const [pages, setPages] = useState<any>(0);
    const currentUser = GetUserInfo()
    const navigate = useNavigate()

    useEffect(() => {
        getAllUsers(metaKey, currentPage, rowsPerPage)
    }, []);

    const searchTeamMember = (ele: any) => {
        let search = ele.target.value;
        let metaKey = search && search.length >= 3 ? search.toLowerCase() : ''
        setMetaKey(metaKey)
    };

    const getAllUsers = (_meta_key: string, _currentPage: any, _rowsPerPage: any) => {
        setIsLoading(true)
        let params = {
            limit: _rowsPerPage ? _rowsPerPage : rowsPerPage,
            page: _currentPage ? _currentPage : currentPage,
            meta_key: _meta_key,
            selectedRole: 'admin'
        };

        usersApiService.getAllUsers(params).then((res: any) => {
            setIsLoading(false)
            setUsers(res?.data?.data)
            setPages(res.data?.pages)
        }).catch(() => {
            setIsLoading(false)
            NotifyError(props.t('fail-catch'))
        })
    }

    const deleteUser = (values: any) => {
        setToggleModalDelete(true)
        setDataModalDelete({id: values?.user_id, username: values?.username})
    }

    const confirmDeleteUser = () => {
        if (dataModalDelete?.id) {
            setBlockAddEditUser(true)
            usersApiService.delete(dataModalDelete?.id).then((res: any) => {
                if (res?.data?.success) {
                    setBlockAddEditUser(false)
                    setToggleModalDelete(false)
                    getAllUsers(metaKey, 1, rowsPerPage)
                    NotifySuccess(props.t('admin-deleted'))
                } else {
                    setBlockAddEditUser(false)
                    NotifyInfo(res?.data?.message)
                }
            }).catch(() => {
                setBlockAddEditUser(false)
                NotifyError(props.t('fail-catch'))
            })
        }
    }

    const confirmEnableDisableUser = () => {
        if (dataModalEnableDisable?.id) {
            setBlockAddEditUser(true)
            let user_data = {
                user_id: dataModalEnableDisable?.id,
                status: dataModalEnableDisable?.status === 'Enable' ? 'Y' : 'N'
            }
            usersApiService.update(user_data).then((res: any) => {
                if (res?.data?.status) {
                    setBlockAddEditUser(false)
                    setToggleModalEnableDisable(false)
                    getAllUsers(metaKey, currentPage, rowsPerPage)
                    NotifySuccess(props.t('admin-updated'))
                } else {
                    setBlockAddEditUser(false)
                    NotifyInfo(res?.data?.message)
                }
            }).catch(() => {
                setBlockAddEditUser(false)
                NotifyError(props.t('fail-catch'))
            })
        }
    }

    const cancelEnableDisableUser = () => {
        setDataModalEnableDisable(null)
        setToggleModalEnableDisable(false)
    }

    const cancelDeleteUser = () => {
        setToggleModalDelete(false)
        setDataModalDelete(null)
    }

    const enable_DisableUser = (values: any) => {
        setToggleModalEnableDisable(true)
        setDataModalEnableDisable({
            id: values?.user_id,
            status: values?.status === 'Y' ? 'Disable' : 'Enable',
            username: values?.username
        })
    }

    const verifyUnverifyUser = (user: any) => {
        setToggleModalVerify(true);
        setDataModalVerify({
            id: user?.user_id,
            username: user?.username,
            currentVerificationStatus: user?.is_verified,
            action: user?.is_verified ? 'unverify' : 'verify'
        });
    };

    const confirmVerifyUnverifyUser = () => {
        if (dataModalVerify?.id) {
            setBlockAddEditUser(true);
            let user_data = {
                user_id: dataModalVerify?.id,
                is_verified: !dataModalVerify?.currentVerificationStatus // Inverse du statut actuel
            }
            usersApiService.update(user_data).then((res: any) => {
                if (res?.data?.status) {
                    setBlockAddEditUser(false);
                    setToggleModalVerify(false);
                    getAllUsers(metaKey, currentPage, rowsPerPage);
                    const successMessage = dataModalVerify?.action === 'verify'
                        ? props.t('account-verified')
                        : props.t('account-unverified');
                    NotifySuccess(successMessage);
                } else {
                    setBlockAddEditUser(false);
                    NotifyInfo(res?.data?.message);
                }
            }).catch(() => {
                setBlockAddEditUser(false);
                NotifyError(props.t('fail-catch'));
            });
        }
    };

    const cancelVerifyUser = () => {
        setDataModalVerify(null);
        setToggleModalVerify(false);
    };

    const handlePagination = (_page: any) => {
        let _currentPage = _page.selected;
        setCurrentPage(_currentPage)
        getAllUsers(metaKey, _currentPage + 1, rowsPerPage)
    }

    // New function to navigate to user's workflow
    const navigateToUserWorkflow = (user: any) => {
        navigate('/workflow', {
            state: {
                user: user,
                adminWorkflow: true // Flag to indicate this is an admin-specific workflow
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
                        <div className="user_name">{cellProps?.username}</div>
                    </div>)
                }
            },
            {
                Header: props.t('email'),
                accessor: "email",
                Filter: false,
            },
            {
                Header: props.t('create-date'),
                accessor: (cellProps: any) => {
                    return <div>{moment(cellProps?.created_at).format('ll')}</div>
                },
                Filter: false
            },
            {
                Header: props.t('status'),
                Filter: false,
                accessor: (cellProps: any) => {
                    switch (cellProps?.status) {
                        case "Y":
                            return (<span className="badge badge-soft-success"> {props.t('active')}</span>)
                        case "N":
                            return (<span className="badge badge-soft-danger"> {props.t('inactive')}</span>)
                        default:
                            return (<span className="badge badge-soft-success"> {cellProps?.status}</span>)
                    }
                },
            },
            {
                Header: props.t('active'),
                Filter: false,
                accessor: (cellProps: any) => {
                    switch (cellProps?.is_verified) {
                        case true:
                            return (<span className="badge badge-soft-success"> {props.t('active')}</span>)
                        default:
                            return (<span className="badge badge-soft-danger"> {props.t('inactive')}</span>)
                    }
                },
            },
            {
                Header: props.t('phone-number'),
                Filter: false,
                accessor: (cellProps: any) => {
                    const data = PhoneNumbers(cellProps)
                    if(data){
                        const flagImageSrc = require(`assets/images/flags/${data?.abv}.svg`);
                        return (<div><img width={20} src={flagImageSrc} alt={data?.name}/> {data?.dialCode}{data?.phone_number}</div>)
                    }
                    return null
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
                                        navigate('/admins/edit', {
                                            state: {
                                                user: cellProps?.row?.original
                                            }
                                        })
                                    }}>
                                        <Dropdown.Item>
                                            <i className="ri-pencil-fill align-bottom me-2 text-muted"/> {props.t('edit')}
                                        </Dropdown.Item>
                                    </li>

                                    <li onClick={() => navigateToUserWorkflow(cellProps?.row?.original)}>
                                        <Dropdown.Item>
                                            <i className="ri-git-branch-line align-bottom me-2 text-muted"/> {props.t('workflow')}
                                        </Dropdown.Item>
                                    </li>

                                    <li onClick={() => {
                                        deleteUser(cellProps?.row?.original)
                                    }}>
                                        <Dropdown.Item className="remove-list">
                                            <i className="ri-delete-bin-fill align-bottom me-2 text-muted"/>{props.t('delete')}
                                        </Dropdown.Item>
                                    </li>
                                    <li onClick={() => {
                                        enable_DisableUser(cellProps?.row?.original)
                                    }}>
                                        <Dropdown.Item className="remove-list">
                                            <i className="ri-switch-fill align-bottom me-2 text-muted"/>{cellProps?.row?.original?.status === 'Y' ? props.t('disable') : props.t('enable')}
                                        </Dropdown.Item>
                                    </li>
                                    <li onClick={() => verifyUnverifyUser(cellProps?.row?.original)}>
                                        <Dropdown.Item>
                                            <i className={`ri-shield-${cellProps?.row?.original?.is_verified ? 'close' : 'check'}-fill align-bottom me-2 ${cellProps?.row?.original?.is_verified ? 'text-warning' : 'text-success'}`}/>
                                            {cellProps?.row?.original?.is_verified ? props.t('unverify-account') : props.t('verify-account')}
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

    const handlePerPage = (e: any) => {
        setRowsPerPage(parseInt(e));
        setCurrentPage(0);
        getAllUsers(metaKey, 1, e)
    };

    return (
        <React.Fragment>
            {/* Delete Modal */}
            {toggleModalDelete ?
                <ConfirmModal
                    message={props.t('confirm-delete-admin')}
                    handleModal={toggleModalDelete}
                    onConfirm={confirmDeleteUser}
                    onCancel={cancelDeleteUser}
                    block={blockAddEditUSer}
                    textConfirm={props.t('delete')}
                    blockText={props.t('deleting...')}
                ></ConfirmModal> : null}

            {/* Enable/Disable Modal */}
            {toggleModalEnableDisable ?
                <ConfirmModalEnableDisable
                    message={dataModalEnableDisable?.status === 'Enable' ? props.t(`confirm-enable-admin`) : props.t(`confirm-disable-admin`)}
                    handleModal={toggleModalEnableDisable}
                    onConfirm={confirmEnableDisableUser}
                    onCancel={cancelEnableDisableUser}
                    block={blockAddEditUSer}
                    textConfirm={dataModalEnableDisable?.status || 'Confirm'}
                    blockText={dataModalEnableDisable?.status === 'Enable' ? props.t('enabling...') : props.t('disabling...') || props.t('confirming...')}
                ></ConfirmModalEnableDisable> : null}

            {/* Verify/Unverify Modal */}
            {toggleModalVerify ?
                <ConfirmModalEnableDisable
                    message={dataModalVerify?.action === 'verify'
                        ? props.t('confirm-verify-admin')
                        : props.t('confirm-unverify-admin')}
                    handleModal={toggleModalVerify}
                    onConfirm={confirmVerifyUnverifyUser}
                    onCancel={cancelVerifyUser}
                    block={blockAddEditUSer}
                    textConfirm={dataModalVerify?.action === 'verify'
                        ? props.t('verify')
                        : props.t('unverify')}
                    blockText={dataModalVerify?.action === 'verify'
                        ? props.t('verifying...')
                        : props.t('unverifying...')}
                ></ConfirmModalEnableDisable> : null}

            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumb title={'list-admins'} ParentTitle={'list-admins'} props={props}/>
                    <Row id="usersList">
                        <Col lg={12}>
                            <Card>
                                <Card.Body>
                                    <Row className="g-lg-2 g-4">
                                        <Col sm={3}>
                                            <div className="search-box">
                                                <input type="text" className="form-control search"
                                                       placeholder={props.t('search...')}
                                                       onChange={(e) => searchTeamMember(e)}/>
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </Col>
                                        <Col sm={3} className="">
                                            <Button onClick={() => getAllUsers(metaKey, 1, rowsPerPage)}
                                                    variant='primary'
                                                    type="button"
                                                    className="add-btn">{props.t('search')}
                                            </Button>
                                        </Col>
                                        <Col sm={3} className="col-lg-auto ms-auto">
                                            <Button onClick={() => {
                                                navigate('/admins/add', {
                                                    state: {
                                                        user: null
                                                    }
                                                });
                                            }} variant='primary' type="button"
                                                    className="w-100 add-btn">
                                                {props.t('add-admin')}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                            <Card>
                                <Card.Body>
                                    <div>
                                        {isLoading ? <SkeletonTable numberOfRows={5}/> : <>
                                            {users && users.length !== 0 ? <TableContainer
                                                    columns={(columns || [])}
                                                    data={(users || [])}
                                                    handlePerPageChanged={handlePerPage}
                                                    iscustomPageSize={true}
                                                    isBordered={false}
                                                    customPageSize={rowsPerPage}
                                                    className="custom-header-css table align-middle table-nowrap"
                                                    tableClassName="table-centered align-middle table-nowrap mb-0"
                                                    theadClassName="text-muted table-light"
                                                    SearchPlaceholder='Search Products...'
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

export default withRouter(withTranslation()(UsersList));