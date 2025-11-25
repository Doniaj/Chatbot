import React, {useEffect, useState} from 'react';
import {Alert, Button, Card, Col, Container, Form, Row, Spinner} from 'react-bootstrap';
import {Link, useLocation} from 'react-router-dom';
import {useDispatch, useSelector} from "react-redux";
import * as Yup from "yup";
import {useFormik} from "formik";
import {loginUser, resetLoginFlag} from "slices/thunk";
import withRouter from 'Common/withRouter';
import logoSm from 'assets/images/logoPRDV.png';
import {NotifyError} from '../../../Common/Toast'
import siteConfig from "../../../configs/site.config";


const Login = (props: any) => {

    document.title = "Login";
    const {state} = useLocation();
    const isVerified = state?.verified;
    const verify_message = state?.message;
    const dispatch = useDispatch<any>();
    const {user, error} = useSelector((state: any) => ({
        user: state.Login.user,
        error: state.Login.error,
    }));

    const [userLogin, setUserLogin] = useState<any>([]);
    const [passwordShow, setPasswordShow] = useState<any>(false);
    const [loader, setLoader] = useState<boolean>(false);

    useEffect(() => {
        if (user && user) {
            setUserLogin({
                email: user.email,
                password: user.password
            });
        }
    }, [user]);

    const validation: any = useFormik({
        // enableReinitialize : use this flag when initial values needs to be changed
        enableReinitialize: true,

        initialValues: {
            email: userLogin.email || '',
            password: userLogin.password || '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email().matches(/^(?!.*@[^,]*,)/).required("Please Enter Your Email"),
            password: Yup.string().required("Please Enter Your Password"),
        }),
        onSubmit: (values) => {
            dispatch(loginUser(values, props.router.navigate));
            setLoader(true)
        }
    });
    useEffect(() => {
        // setTimeout(() => {
        //     dispatch(resetLoginFlag());
        // }, 10000);
        setLoader(false)
    }, [dispatch, error]);

    const SingIn = (e: any) => {
        e.preventDefault();
        dispatch(resetLoginFlag())
        let {email, password} = validation.values
        if (!email || !password) {
            return NotifyError('Enter your password or email');
        }
        let data = {email: email, password: password}
        setLoader(true)
        dispatch(loginUser(data, props.router.navigate));
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
                                            <img src={logoSm} alt=""  height="90" width="100"  className="img-fluid "/>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="p-2">
                                                <div className="text-center"><p className="text-muted fs-15">Sign in to
                                                    continue.</p>
                                                </div>
                                                {error &&(<Alert variant="danger" dismissible={false}>{error === 'unverified-account' ? "Your account is currently unverified. Click the button below to verify your account." : error}
                                                </Alert>)}
                                                {isVerified && (<Alert variant="success"> Account Verified Successfully, Please Login
                                                    ! </Alert>)}
                                                <Form action="#" onSubmit={(e) => SingIn(e)}>

                                                    <div className="mb-3">
                                                        <Form.Label htmlFor="username">Email</Form.Label>
                                                        <Form.Control name="email" type="email" className="form-control"
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

                                                    <div className="mb-3">
                                                        <div className="float-end">
                                                            <Link to={"/forgetPassword"} className="text-muted">Forgot
                                                                password?</Link>
                                                        </div>
                                                        <Form.Label htmlFor="password-input">Password</Form.Label>
                                                        <div className="position-relative auth-pass-inputgroup mb-3">
                                                            <Form.Control className="form-control pe-5 password-input"
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

                                                    <div className="form-check">
                                                        <Form.Check type="checkbox" value="" id="auth-remember-check"/>
                                                        <Form.Label htmlFor="auth-remember-check">Remember
                                                            me</Form.Label>
                                                    </div>

                                                    <div className="mt-4">
                                                        <Button variant='primary' className="w-100" type="submit"
                                                                disabled={loader}>{loader &&
                                                            <Spinner size="sm" animation="border" className="me-2"/>}Sign
                                                            In</Button>
                                                    </div>
                                                    {error && error === 'unverified-account' && (<div className="mt-4">
                                                        <Button variant='primary' className="w-100"
                                                                disabled={true}>Verify Account</Button>
                                                    </div>)}

                                                </Form>
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
