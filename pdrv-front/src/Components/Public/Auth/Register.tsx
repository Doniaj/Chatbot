import React, {useEffect, useState} from 'react';
import {Alert, Button, Card, Col, Container, Form, Row, Spinner} from 'react-bootstrap';
import {Link, useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from "react-redux";
import * as Yup from "yup";
import {useFormik} from "formik";
import {loginUser, resetLoginFlag} from "slices/thunk";
import withRouter from 'Common/withRouter';
import logoSm from 'assets/images/logoPRDV.png';
import {NotifyError} from '../../../Common/Toast'
import siteConfig from "../../../configs/site.config";
import PhoneInput from "react-phone-input-2";
import masks from "../../../helpers/masksPhoneNumbers.json"
import 'react-phone-input-2/lib/style.css';
import usersApiService from "../../../util/services/UsersApiService"; // Ensure you include the CSS for proper styling

const Login = (props: any) => {

    document.title = "Register";

    const [passwordShow, setPasswordShow] = useState<any>(false);
    const [confirmPasswordShow, setConfirmPasswordShow] = useState<any>(false);
    const [loader, setLoader] = useState<boolean>(false);
    const [phoneNumber, setPhoneNumber] = useState<any>('');
    const [error, setError] = useState<string>('');
    const [errorVariant, setErrorVariant] = useState<string>('danger');
    const navigate = useNavigate();
    const [countryData, setCountryData] = React.useState({
        countryName: "",
        countryCode: "",
        dialCode: "",
        format: ""
    });
    const validation: any = useFormik({
        // enableReinitialize : use this flag when initial values needs to be changed
        enableReinitialize: true,

        initialValues: {
            first_name: "",
            last_name: "",
            password: "",
            confirm_password: "",
            email: '',
            address: "",
            phone_number : "",
            country_code : "",
            country : ""
        },
        validationSchema: Yup.object({
            first_name: Yup.string().required("Please enter your first name"),
            last_name: Yup.string().required("Please enter your last name"),
            address: Yup.string().required("Please enter your address"),
            email: Yup.string()
                .email("Invalid email format")
                .matches(/^(?!.*@[^,]*,)/, "Email must not contain commas")
                .required("Please enter your email"),
            password: Yup.string()
                .required("Please enter your password")
                .min(8, "Password must be at least 8 characters")
                .matches(/[a-z]/, "Password must contain at least one lowercase letter")
                .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
                .matches(/[0-9]/, "Password must contain at least one number"),
            confirm_password: Yup.string()
                .required("Please confirm your password")
                .oneOf([Yup.ref('password')], "Passwords must match"),
        }),
        onSubmit: (values, {setErrors}) => {
            setError("")
            if(phoneNumber !== "" && countryData?.dialCode !== ""){
                if(phoneNumber === countryData?.dialCode){
                    return setErrors({phone_number: "Phone Number Required"})
                }
                let lenPhoneNumber = phoneNumber.length
                const dotCount = countryData?.format.split('.').length - 1;
                if(lenPhoneNumber < dotCount){
                    return setErrors({phone_number: `must be in format : ${countryData?.format}`})
                }
                values.phone_number = ("+"+phoneNumber).replace("+"+countryData?.dialCode, '');
                values.country_code = countryData?.dialCode
                values.country = countryData?.countryName
                setLoader(true)
                usersApiService.Register(values).then((response) => {
                    let data = response?.data
                    if(data?.success){
                        navigate('/login', {state: {verified : true, message : data?.message}})
                        validation.resetForm()
                        setPhoneNumber("216")
                    }
                    setError(data?.message)
                    setErrorVariant(data?.type)
                    setLoader(false)

                }).catch((error) => {
                    setError("fail-catch")
                    setErrorVariant("danger")
                    setLoader(false)
                })
            }else{
                return setErrors({phone_number: "Phone Number Required"})
            }
            // dispatch(loginUser(values, props.router.navigate));
            // setLoader(true)
        },
        validate: (values) => {
            const errors: any = {}
            if(phoneNumber !== "" && countryData?.dialCode !== "" && phoneNumber !== countryData?.dialCode){
                let lenPhoneNumber = phoneNumber.length
                const dotCount = countryData?.format.split('.').length - 1;
                if(lenPhoneNumber === dotCount){
                    delete errors.phone_number
                }
            }
            return errors
        }
    });
    // useEffect(() => {
    //     setTimeout(() => {
    //         dispatch(resetLoginFlag());
    //     }, 3000);
    //     setLoader(false)
    // }, [dispatch, error]);

    const SignUp = (e: any) => {
        e.preventDefault();
        let {email, password} = validation.values
        if (!email || !password || !password) {
            return NotifyError('Enter your password or email');
        }
        let data = {email: email, password: password}
        setLoader(true)
        // dispatch(loginUser(data, props.router.navigate));
    }

    return (
        <React.Fragment>
            <section
                className="auth-page-wrapper position-relative bg-light min-vh-100 d-flex align-items-center justify-content-between">
                <div className="w-100">
                    <Container>
                        <Row className="justify-content-center">
                            <Col lg={6}>
                                <div className="mx-lg-3">
                                    <Card className="border-0 mb-0 card">
                                        <Card.Header className="border-0 text-center">
                                            <img src={logoSm} alt="" className="img-fluid "/>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="p-2">
                                                <div className="text-center"><p className="text-muted fs-15">Sign up to
                                                    continue to Fonivoice.</p>
                                                </div>
                                                {error && error !== "" ? (<Alert variant={errorVariant}> {error}</Alert>) : null}

                                                <Form action="#" onSubmit={validation.handleSubmit}>
                                                    <Row>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Form.Label htmlFor="first_name">First Name</Form.Label>
                                                                <Form.Control name="first_name" type="text"
                                                                              className="form-control"
                                                                              id="first_name"
                                                                              placeholder="Enter Your First Name"
                                                                              onChange={validation.handleChange}
                                                                              onBlur={validation.handleBlur}
                                                                              value={validation.values.first_name || ""}
                                                                              isInvalid={
                                                                                  !!(validation.touched.first_name && validation.errors.first_name)
                                                                              }
                                                                />
                                                                {validation.touched.first_name && validation.errors.first_name ? (
                                                                    <Form.Control.Feedback
                                                                        type="invalid">{validation.errors.first_name}</Form.Control.Feedback>
                                                                ) : null}
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Form.Label htmlFor="last_name">Last Name</Form.Label>
                                                                <Form.Control name="last_name" type="text"
                                                                              className="form-control"
                                                                              id="last_name"
                                                                              placeholder="Enter Your Last Name"
                                                                              onChange={validation.handleChange}
                                                                              onBlur={validation.handleBlur}
                                                                              value={validation.values.last_name || ""}
                                                                              isInvalid={
                                                                                  !!(validation.touched.last_name && validation.errors.last_name)
                                                                              }
                                                                />
                                                                {validation.touched.last_name && validation.errors.last_name ? (
                                                                    <Form.Control.Feedback
                                                                        type="invalid">{validation.errors.last_name}</Form.Control.Feedback>
                                                                ) : null}
                                                            </div>
                                                        </Col>
                                                        <Col md={12}>
                                                            <div className="mb-3">
                                                                <Form.Label htmlFor="username">Email</Form.Label>
                                                                <Form.Control name="email" type="email"
                                                                              className="form-control"
                                                                              id="username" placeholder="Enter Email"
                                                                              onChange={validation.handleChange}
                                                                              onBlur={validation.handleBlur}
                                                                              value={validation.values.email || ""}
                                                                              isInvalid={
                                                                                  !!(validation.touched.email && validation.errors.email)
                                                                              }
                                                                />
                                                                {validation.touched.email && validation.errors.email ? (
                                                                    <Form.Control.Feedback
                                                                        type="invalid">{validation.errors.email}</Form.Control.Feedback>
                                                                ) : null}
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Form.Label htmlFor="phone_number">Phone Number</Form.Label>
                                                                        <PhoneInput
                                                                            country={"tn"}
                                                                            inputStyle={{
                                                                                width: "100%",
                                                                                height: "100%"
                                                                            }}
                                                                            masks={masks}
                                                                            value={phoneNumber}
                                                                            onChange={(value: any, data : any) => {
                                                                                setPhoneNumber(value)
                                                                                setCountryData({
                                                                                    countryName: data?.name,
                                                                                    countryCode: data?.countryCode,
                                                                                    dialCode: data?.dialCode,
                                                                                    format: data?.format
                                                                                });
                                                                            }} disabled={loader}/>
                                                                {validation?.errors?.phone_number ?
                                                                    <div
                                                                        className="errorInvalidMessages">{validation.errors.phone_number}</div> : null}
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Form.Label htmlFor="address">Address</Form.Label>
                                                                <Form.Control name="address" type="textarea"
                                                                              className="form-control"
                                                                              id="address"
                                                                              placeholder="Enter Your Address"
                                                                              onChange={validation.handleChange}
                                                                              onBlur={validation.handleBlur}
                                                                              value={validation.values.address || ""}
                                                                              isInvalid={
                                                                                  !!(validation.touched.address && validation.errors.address)
                                                                              }
                                                                />
                                                                {validation.touched.address && validation.errors.address ? (
                                                                    <Form.Control.Feedback
                                                                        type="invalid">{validation.errors.address}</Form.Control.Feedback>
                                                                ) : null}
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Form.Label
                                                                    htmlFor="password-input">Password</Form.Label>
                                                                <div
                                                                    className="position-relative auth-pass-inputgroup mb-3">
                                                                    <Form.Control
                                                                        className="form-control pe-5 password-input"
                                                                        placeholder="Enter password"
                                                                        id="password-input"
                                                                        name="password"
                                                                        value={validation.values.password || ""}
                                                                        type={passwordShow ? "text" : "password"}
                                                                        onChange={validation.handleChange}
                                                                        onBlur={validation.handleBlur}
                                                                        isInvalid={
                                                                            !!(validation.touched.password && validation.errors.password)
                                                                        }
                                                                    />
                                                                    {validation.touched.password && validation.errors.password ? (
                                                                        <Form.Control.Feedback
                                                                            type="invalid">{validation.errors.password}</Form.Control.Feedback>
                                                                    ) : null}
                                                                    <Button variant='link'
                                                                            className="position-absolute end-0 top-0 text-decoration-none text-muted password-addon"
                                                                            type="button" id="password-addon"
                                                                            onClick={() => setPasswordShow(!passwordShow)}><i
                                                                        className="ri-eye-fill align-middle"></i></Button>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Form.Label
                                                                    htmlFor="confirm_password">Confirm Password</Form.Label>
                                                                <div
                                                                    className="position-relative auth-pass-inputgroup mb-3">
                                                                    <Form.Control
                                                                        className="form-control pe-5 password-input"
                                                                        placeholder="Confirm Password"
                                                                        id="confirm_password"
                                                                        name="confirm_password"
                                                                        value={validation.values.confirm_password || ""}
                                                                        type={confirmPasswordShow ? "text" : "password"}
                                                                        onChange={validation.handleChange}
                                                                        onBlur={validation.handleBlur}
                                                                        isInvalid={
                                                                            !!(validation.touched.confirm_password && validation.errors.confirm_password)
                                                                        }
                                                                    />
                                                                    {validation.touched.confirm_password && validation.errors.confirm_password ? (
                                                                        <Form.Control.Feedback
                                                                            type="invalid">{validation.errors.confirm_password}</Form.Control.Feedback>
                                                                    ) : null}
                                                                    <Button variant='link'
                                                                            className="position-absolute end-0 top-0 text-decoration-none text-muted password-addon"
                                                                            type="button" id="password-addon"
                                                                            onClick={() => setConfirmPasswordShow(!confirmPasswordShow)}><i
                                                                        className="ri-eye-fill align-middle"></i></Button>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                    <div className="mt-4">
                                                        <Button variant='primary' className="w-100" type="submit"
                                                                disabled={loader}>{loader &&
                                                            <Spinner size="sm" animation="border" className="me-2"/>}Sign
                                                            up</Button>
                                                    </div>

                                                </Form>
                                            </div>
                                            <div className="mt-4 text-center">
                                                <p className="mb-0">Already have an account? <Link to='/login'
                                                                                                 className="fw-bold text-primary text-decoration-none"> Log in </Link></p>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </div>
                            </Col>
                        </Row>
                    </Container>

                    <footer className="footer">
                        <Container>
                            <Row>
                                <Col lg={12}>
                                    <div className="text-center">
                                        <p className="mb-0 text-muted">©
                                            {(new Date().getFullYear())} {siteConfig.siteName}. Crafted with <i
                                                className="mdi mdi-heart text-danger"></i> by {siteConfig.siteCreator}
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </Container>
                    </footer>
                </div>
            </section>
        </React.Fragment>
    );
};

export default withRouter(Login);
