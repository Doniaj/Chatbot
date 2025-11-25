import {Button, Card, Col, Form, Row, Spinner} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import {useFormik} from "formik";
import * as Yup from "yup";
import {useStore} from "react-redux";
import usersApiService from "../../../util/services/UsersApiService";
import {GetUserInfo} from "../../../helpers/stringHelper";
import {NotifyError, NotifySuccess} from "../../../Common/Toast";

const AccountPassword = (props : any) => {
    let Props = props.props
    const store = useStore<any>();
    const user: any = store.getState().Login.user || {}
    const userInfo = user? user : GetUserInfo()
    const passwordtype = "password";
    const oldPasswordtype = "password";
    const confirmPasswordtype = 'password';
    const [password, setPassword] = useState('password');
    const [confirmpassword, setConfirmpassword] = useState('password');
    const [oldpassword, setOldpassword] = useState('password');
    const [blockUI,setBlockUI] = useState<boolean>(false)
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            oldPassword: "",
            password: "",
            confirmPassword: ""
        },
        validationSchema: Yup.object({
            oldPassword : Yup.string().required(Props.t('old-password-required')),
            password: Yup.string()
                .min(8, Props.t('password-must-be-8'))
                .matches(RegExp('(.*[a-z].*)'), Props.t('at-least-one-lowercase'))
                .matches(RegExp('(.*[A-Z].*)'), Props.t('at-least-one-uppercase'))
                .matches(RegExp('(.*[0-9].*)'), Props.t('at-least-one-number'))
                .required(Props.t('password-field-required')),
            confirmPassword: Yup.string()
                .required()
                .oneOf([Yup.ref("password")], Props.t('confirm-password-do-not-match')),
        }),
        onSubmit: (values,{setErrors}) => {
            setBlockUI(true)
            usersApiService.changePassword({oldPassword : values.oldPassword,password : values?.password, user_id : userInfo?.user_id}).then((result : any) =>{
                if(result?.data?.success){
                    setBlockUI(false)
                    NotifySuccess(Props.t('password-changed'))
                    formik.resetForm()
                }else{
                    setBlockUI(false)
                    setErrors({ oldPassword: Props.t('incorrect-password') })
                }
            }).catch(()=>{
                NotifyError(Props.t('cannot-update-password'))
            })
        },
    });
    useEffect(() => {
       formik.resetForm()
    },[])
    const handleOldPassword = () => {
        oldPasswordtype === oldpassword ? setOldpassword("text") : setOldpassword("password");
    }
    const handleConfirmPassword = () => {
        confirmPasswordtype === confirmpassword ? setConfirmpassword("text") : setConfirmpassword("password");
    }
    const handlePassword = () => {
        passwordtype === password ? setPassword("text") : setPassword("password");
    }
    return (
        <div className="tab-pane fade show" id="custom-v-pills-setting" role="tabpanel">
            <Row>
                <Col lg={12}>
                    <Card>
                        <Card.Body>
                            <div className="mb-3" id="changePassword">
                                <h5 className="fs-16 text-decoration-underline mb-4">{Props.t('change-password')}</h5>
                                <Form action="" onSubmit={formik.handleSubmit}>
                                    <Row className="g-2">
                                        <Col lg={4}>
                                            <div>
                                                <Form.Label htmlFor="oldpasswordInput">{Props.t('old-password')}<span
                                                    className="text-danger">*</span></Form.Label>
                                                <Form.Control type={oldpassword}
                                                              id="oldpasswordInput"
                                                              placeholder={Props.t('enter-old-password')}
                                                              name="oldPassword"
                                                              onChange={formik.handleChange}
                                                              value={formik.values.oldPassword}
                                                              onBlur={formik.handleBlur}
                                                              disabled={blockUI}
                                                />
                                                {formik.errors.oldPassword && formik.touched.oldPassword ? (
                                                    <span
                                                        className="text-danger">{formik.errors.oldPassword}</span>
                                                ) : null}
                                                <Button
                                                    className="btn btn-link position-absolute end-0 text-decoration-none text-muted password-addon" style={{top : "30px"}}
                                                    id="confirm-password-input" bsPrefix="btn btn-none"
                                                    onClick={handleOldPassword}>{oldpassword === 'text' ? <i
                                                    className="ri-eye-off-fill align-middle"/> : <i
                                                    className="ri-eye-fill align-middle"/>}</Button>
                                            </div>

                                        </Col>
                                        <Col lg={4}>
                                            <div>
                                                <Form.Label htmlFor="newpasswordInput" >{Props.t('new-password')}<span
                                                    className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type={password}
                                                    id="newpasswordInput"
                                                    placeholder={Props.t('enter-new-password')}
                                                    name="password"
                                                    onChange={formik.handleChange}
                                                    value={formik.values.password}
                                                    onBlur={formik.handleBlur}
                                                    disabled={blockUI}/>
                                                {formik.errors.password && formik.touched.password ? (
                                                    <span
                                                        className="text-danger">{formik.errors.password}</span>
                                                ) : null}
                                                <Button
                                                    className="btn btn-link position-absolute end-0 text-decoration-none text-muted password-addon" style={{top : "30px"}}
                                                    id="confirm-password-input" bsPrefix="btn btn-none"
                                                    onClick={handlePassword}>{password === 'text' ? <i
                                                    className="ri-eye-off-fill align-middle"/> : <i
                                                    className="ri-eye-fill align-middle"/>}</Button>
                                            </div>
                                        </Col>
                                        <Col lg={4}>
                                            <div>
                                                <Form.Label htmlFor="confirmpasswordInput" >{Props.t('confirm-password')}<span
                                                    className="text-danger">*</span></Form.Label>
                                                <Form.Control type={confirmpassword}
                                                              id="confirmpasswordInput"
                                                              placeholder={Props.t('confirm-new-password')}
                                                              name="confirmPassword"
                                                              onChange={formik.handleChange}
                                                              value={formik.values.confirmPassword}
                                                              onBlur={formik.handleBlur}
                                                              disabled={blockUI}/>
                                                {formik.errors.confirmPassword && formik.touched.confirmPassword ? (
                                                    <span
                                                        className="text-danger">{formik.errors.confirmPassword}</span>
                                                ) : null}
                                                <Button
                                                    className="btn btn-link position-absolute end-0 text-decoration-none text-muted password-addon" style={{top : "30px"}}
                                                    id="confirm-password-input" bsPrefix="btn btn-none"
                                                    onClick={handleConfirmPassword}>{confirmpassword === 'text' ? <i
                                                    className="ri-eye-off-fill align-middle"/> : <i
                                                    className="ri-eye-fill align-middle"/>}</Button>
                                            </div>
                                        </Col>
                                    </Row>
                                    <div className="text-end mt-4">
                                        <Button variant="primary" className="btn btn-secondary d-block d-sm-inline-block text-end mt-2" type="submit" disabled={blockUI} >{blockUI ? <Spinner size="sm" animation="border" className="me-2" /> : <i className="ri-edit-box-line align-middle me-2"></i>}{blockUI ? Props.t('updating...') : Props.t('update')}</Button>
                                    </div>
                                </Form>
                            </div>

                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
export default AccountPassword;