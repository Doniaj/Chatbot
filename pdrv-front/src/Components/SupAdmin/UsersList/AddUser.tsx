import {Button, Card, Col, Container, InputGroup, Row, Spinner} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Select from "react-select";
import React, {useEffect, useState} from "react";
import Breadcrumb from "../../../Common/BreadCrumb";
import {useFormik} from "formik";
import * as Yup from "yup";
import {useLocation, useNavigate} from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import 'react-phone-input-2/lib/style.css'
import {NotifyError, NotifyInfo, NotifySuccess} from "../../../Common/Toast";
import rolesApiService from "../../../util/services/RolesApiService";
import {abreviationCountryDialCode, formatTime, generatePassword, GetUserInfo} from "../../../helpers/stringHelper";
import UsersApiService from "../../../util/services/UsersApiService";
import usersApiService from "../../../util/services/UsersApiService";
import withRouter from "../../../Common/withRouter";
import {withTranslation} from "react-i18next";
import moment from "moment";
import masks from "../../../helpers/masksPhoneNumbers.json";

interface ClientInterface {
    user_id?: null | number;
    first_name: string;
    last_name: string;
    username?: string;
    email: string;
    role_id?: number;
    phone_number?: string;
    status?: string;
    active?: string;
    address?: string;
    updated_at : moment.Moment,
    created_at?: moment.Moment,
    is_verified?: boolean;
    country_code?: string;
    country?: string;
    password: string;
}

const AddEditUser = (props: any) => {
    const currentUser = GetUserInfo()
    const location = useLocation();
    const navigate = useNavigate();
    const user = location.state?.user;
    const [blockUI, setBlockUI] = useState<boolean>(false)
    const [role, setRole] = useState<any>(null)
    const [password, setPassword] = useState<string>("")
    const [countryAbreviation, setCountryAbreviation] = useState<string>("tn")
    const [phoneNumber, setPhoneNumber] = useState<any>('');
    const [countryData, setCountryData] = React.useState({
        countryName: "",
        countryCode: "",
        dialCode: "",
        format: ""
    });

    function onKeyDown(keyEvent: any) {
        if ((keyEvent.charCode || keyEvent.keyCode) === 13) {
            keyEvent.preventDefault();
        }
    }

    const Client = Yup.object({
        first_name: Yup.string().required(props.t('add-first-name')),
        last_name: Yup.string().required(props.t('add-last-name')),
        email: Yup.string().email().matches(/^(?!.*@[^,]*,)/).required(props.t("add-email")),
    })

    useEffect(() => {
        getRoles()
        if (user) {
            validation.setValues({
                id: user?.user_id,
                first_name: user?.first_name,
                last_name: user?.last_name,
                email: user?.email,
                address: user?.address,
                phone_number: user?.phone_number,
                country_code: user?.country_code,
                country: user?.country
            });
            if(user?.phone_number && user?.country_code){
                setPhoneNumber("+"+user?.country_code+user?.phone_number)
                setCountryAbreviation(abreviationCountryDialCode(user?.country_code))
            }else{
                setPhoneNumber("+216")
            }
        } else {
            setPassword(generatePassword())
            validation.resetForm()
        }
    }, []);
    const getRoles = () => {
        let params = {
            filter: [
                {
                    operator: "and",
                    conditions: [
                        {
                            field: "role_name",
                            operator: "eq",
                            value: 'admin',
                        }
                    ]
                }
            ]
        }
        rolesApiService.find(params).then((result: any) => {
            let data = result?.data?.data;
            setRole({label: data[0].role_name, value: data[0].role_id})
        }).catch((err) => {
            return NotifyError(props.t('catch-fail'))
        })
    }
    const submitUser = (user: any) => {
        let ClientData: ClientInterface = {
            first_name: user?.first_name,
            last_name: user?.last_name,
            username: (user?.first_name || '') + ' ' + (user?.last_name || ''),
            email: user?.email,
            address: user?.address,
            phone_number: user?.phone_number,
            updated_at: moment(new Date()),
            country_code : user?.country_code,
            country : user?.country,
            password:  user?.password
        }
        setBlockUI(true)
        if (user?.id) {
            ClientData['user_id'] = user?.id;
            usersApiService.updateUser(ClientData).then((res: any) => {
                if (res?.data?.success) {
                    setBlockUI(false)
                    NotifySuccess(props.t(`admin-updated`))
                    navigate(`/admins`)
                } else {
                    setBlockUI(false)
                    NotifyInfo(res?.data?.message)
                }
            }).catch(() => {
                setBlockUI(false)
                NotifyError(props.t('fail-catch'))
            })
        } else {
                ClientData['status'] = 'Y';
                ClientData['active'] = 'Y';
                ClientData['created_at'] = moment(new Date());
                ClientData['role_id'] = role.value
                UsersApiService.addUser(ClientData).then((res: any) => {
                    if (res?.data?.success) {
                        setBlockUI(false)
                        NotifySuccess(props.t('admin-added'))
                        navigate(`/admins`)
                    } else {
                        setBlockUI(false)
                        NotifyInfo(res?.data?.message)
                    }
                }).catch(() => {
                    setBlockUI(false)
                    NotifyError(props.t('fail-catch'))
                })
        }
    }
    const validation: any = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: null,
            first_name: '',
            last_name: '',
            username: '',
            address: '',
            email: '',
            phone_number: '',
            password : "",
            country_code : "",
            country : ""
        },
        validationSchema: Client,
        onSubmit: (values, {setErrors}) => {
            if(!user && (!password || password.length === 0)){
                return setErrors({password : "Field Required"})
            }
            if(phoneNumber !== "" && countryData?.dialCode !== ""){
                if(phoneNumber === countryData?.dialCode){
                    setPhoneNumber("")
                    setCountryData({
                        countryName: "",
                        countryCode: "",
                        dialCode: "",
                        format: ""
                    })
                }else{
                    let lenPhoneNumber = phoneNumber.length
                    const dotCount = countryData?.format.split('.').length - 1;
                    if(lenPhoneNumber < dotCount){
                        return setErrors({phone_number: `must be in format : ${countryData?.format}`})
                    }
                }
                values.phone_number = ("+"+phoneNumber).replace("+"+countryData?.dialCode, '');
                values.country_code = countryData?.dialCode
                values.country = countryData?.countryName
            }
            values.password = user ? "" : password
            submitUser(values)
        },
        validate: (values) => {
            const errors: any = {}
            if(!user && password && password !== ""){
                delete errors.password
            }
            return errors
        }
    });
    const changePassword = () => {
        setPassword(generatePassword())
    }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value); // Allow manual editing of the field
    };
    return (
        <div className="page-content">
            <Container fluid={true}>
                <Breadcrumb
                    title={user ? props.t(`edit-admin`) : props.t(`add-admin`)}
                    ParentTitle={props.t(`list-admins`)}
                        LinkParentTitle={`/admins`}
                    ChildTitle={user ? props.t(`edit-admin`) : props.t(`add-admin`)}
                    props={props}/>

                <Form className="needs-validation" onKeyDown={onKeyDown} onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                    return false;
                }}>
                    <Row>
                        <Card>
                            <Card.Header>
                                <div className="d-flex">
                                    <div className="flex-shrink-0 me-3">
                                        <div className="avatar-sm">
                                            <div
                                                className="avatar-title rounded-circle bg-light text-primary fs-20">
                                                <i className="bi bi-box-seam"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="card-title mb-1">{props.t(`user-information`)}</h5>
                                        <p className="text-muted mb-0">{props.t('fill-informations-below')}</p>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Form.Label
                                                        htmlFor="first_name">{props.t('first-name')}</Form.Label>
                                                    <Form.Control type="text"
                                                                  name="first_name"
                                                                  onChange={validation.handleChange}
                                                                  onBlur={validation.handleBlur}
                                                                  value={validation.values.first_name || ""}
                                                                  isInvalid={
                                                                      !!(validation.errors.first_name)
                                                                  }
                                                                  disabled={blockUI}/>
                                                    {validation.errors.first_name ? (
                                                        <Form.Control.Feedback type="invalid">
                                                            <div>{validation.errors.first_name}</div>
                                                        </Form.Control.Feedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="last_name">{props.t('last-name')}</Form.Label>
                                                    <Form.Control type="text"
                                                                  name="last_name"
                                                                  onChange={validation.handleChange}
                                                                  onBlur={validation.handleBlur}
                                                                  value={validation.values.last_name || ""}
                                                                  isInvalid={
                                                                      !!(validation.errors.last_name)
                                                                  }
                                                                  disabled={blockUI}/>
                                                    {validation.errors.last_name ? (
                                                        <Form.Control.Feedback type="invalid">
                                                            <div>{validation.errors.last_name}</div>
                                                        </Form.Control.Feedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="email">{props.t('email')}</Form.Label>
                                                    <Form.Control type="email"
                                                                  name="email"
                                                                  onChange={validation.handleChange}
                                                                  onBlur={validation.handleBlur}
                                                                  value={validation.values.email || ""}
                                                                  isInvalid={
                                                                      !!(validation.errors.email)
                                                                  }
                                                                  disabled={blockUI}/>
                                                    {validation.errors.email ? (
                                                        <Form.Control.Feedback type="invalid">
                                                            <div>{validation.errors.email}</div>
                                                        </Form.Control.Feedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="phone_number">Phone Number</Form.Label>
                                                    <PhoneInput
                                                        country={countryAbreviation}
                                                        inputStyle={{
                                                            width: "100%",
                                                            height: "100%"
                                                        }}
                                                        masks={masks}
                                                        value={phoneNumber}
                                                        onChange={(value: any, data: any) => {
                                                            setPhoneNumber(value)
                                                            setCountryData({
                                                                countryName: data?.name,
                                                                countryCode: data?.countryCode,
                                                                dialCode: data?.dialCode,
                                                                format: data?.format
                                                            });
                                                        }}/>
                                                    {validation?.errors?.phone_number ?
                                                        <div
                                                            className="errorInvalidMessages">{validation.errors.phone_number}</div> : null}
                                                </div>
                                            </Col>
                                            {!user && <Col md={4}>
                                                <Form.Label htmlFor="password">{props.t('password')}</Form.Label>
                                                <InputGroup
                                                    className={`mb-3 ${validation.errors.password ? "errorField" : ""}`}>
                                                    <Form.Control onChange={handleChange} id="password" value={password}
                                                                  defaultValue={password}/>
                                                    <InputGroup.Text className="cursor-pointer"
                                                                     onClick={changePassword}><i
                                                        className="bi bi-arrow-clockwise"></i>
                                                    </InputGroup.Text>
                                                </InputGroup>
                                                {validation.errors.password ?
                                                    <div
                                                        className="errorInvalidMessages">{validation.errors.password}</div> : null}
                                            </Col>}
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <label htmlFor="address"
                                                           className="form-label">{props.t('address')}</label>
                                                    <textarea id="address" rows={3}
                                                              className={validation.errors.address ? "form-control borderStyleInvalid" : "form-control borderStyleGrey"}
                                                              name="address"
                                                              value={validation.values.address}
                                                              onChange={validation.handleChange}
                                                              onBlur={validation.handleBlur}
                                                              disabled={blockUI}
                                                    ></textarea>
                                                    {validation.errors.address ?
                                                        <div
                                                            className="errorInvalidMessages">{validation.errors.address}</div> : null}

                                                </div>
                                            </Col>

                                            {user && <Col md={4}>
                                                <div className="mb-3">
                                                    <div className="fw-bold mt-2 fs-16">{props.t('is-verified')} : <span
                                                        className={user?.is_verified ? "badge badge-soft-success fs-16 ms-3" : "badge badge-soft-danger fs-16 ms-3"}>{user?.is_verified ? "true" : "false"}</span>
                                                    </div>
                                                </div>
                                            </Col>}
                                        </Row>
                                    </Card.Body>
                            <div className="text-end mb-3">
                                <Button type="submit" id="BRAND" className="btn btn-success"
                                        disabled={blockUI}>{blockUI && <Spinner size="sm" animation="border"
                                                                                className="me-2"/>} {blockUI ? (user ? props.t('editing...') : props.t('adding...')) : (user ? props.t('edit') : props.t('add'))}</Button>
                            </div>
                        </Card>
                    </Row>
                </Form>
            </Container>
        </div>
    )
}
export default withRouter(withTranslation()(AddEditUser));
