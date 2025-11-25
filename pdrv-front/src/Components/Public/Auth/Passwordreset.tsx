import React, {useState} from "react";
import {Alert, Button, Card, Col, Container, Form, Image, Row, Spinner} from "react-bootstrap";
import {Link} from "react-router-dom";
import {useFormik} from "formik";
import * as Yup from 'yup';

//img
import auth1 from "assets/images/logoPRDV.png";
import usersApiService from "../../../util/services/UsersApiService";
import siteConfig from "../../../configs/site.config";

const Passwordreset = () => {
    const [typeMessage, setTypeMessage] = useState<string>('primary')
    const [Message, setMessage] = useState<string>('Enter your email and instructions will be sent to you!')
    const [loader, setLoader] = useState<boolean>(false);

    const formik = useFormik({
        initialValues: {
            email: "",
        },
        validationSchema: Yup.object({
            email: Yup.string().email().matches(/^(?!.*@[^,]*,)/).required("Please Enter Your Email")
        }),
        onSubmit: (values) => {
            setLoader(true)
            setTypeMessage('primary')
            setMessage('Sending reset Link to your email...')
            usersApiService.forgotPassword(values).then((result: any) => {
                setLoader(false)
                let res = result.data;
                setTypeMessage(res.type)
                setMessage(res.message)
            }).catch((err: any) => {
                setLoader(false)
                setTypeMessage('danger')
                setMessage('Error, Please Try again')
            })
        },
    });
    return (
        <React.Fragment>
            <section
                className="auth-page-wrapper position-relative bg-light min-vh-100 d-flex align-items-center justify-content-between">
                <div className="w-100">
                    <Container>
                        <Row className="justify-content-center">
                            <Col lg={6}>
                                <div className="auth-card mx-lg-3">
                                    <Card className="border-0 mb-0">
                                        <Card.Header className="bg-primary border-0">
                                            <Row>
                                                <Col lg={4} xs={3}>
                                                    <Image src={auth1} alt="" className="img-fluid"/>
                                                </Col>
                                                <Col lg={8} xs={9}>
                                                    <h1 className="text-white lh-base fw-lighter">Forgot Password?</h1>
                                                </Col>
                                            </Row>
                                        </Card.Header>
                                        <Card.Body>
                                            <p className="text-muted fs-15">Reset password with Toner.</p>
                                            <Alert
                                                className={`alert-borderless alert-${typeMessage} text-center mb-2 mx-2`}
                                                role="alert">
                                                {Message}
                                            </Alert>
                                            <div className="p-2">
                                                <Form onSubmit={formik.handleSubmit}>
                                                    <div className="mb-4">
                                                        <Form.Label htmlFor="email">Email</Form.Label>
                                                        <Form.Control
                                                            type="email"
                                                            id="email"
                                                            name="email"
                                                            placeholder="Enter your email"
                                                            value={formik.values.email}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                        />
                                                        {
                                                            formik.errors.email && formik.touched.email ? (
                                                                <span
                                                                    className="text-danger">{formik.errors.email}</span>
                                                            ) : null
                                                        }
                                                    </div>
                                                    <div className="text-center mt-4">
                                                        <Button variant="primary" className="w-100" type="submit"
                                                                disabled={loader}>{loader &&
                                                            <Spinner size="sm" animation="border" className="me-2"/>}Send
                                                            Reset Link</Button>
                                                    </div>
                                                </Form>{/* end form */}
                                            </div>
                                            <div className="mt-4 text-center">
                                                <p className="mb-0">Wait, I remember my password... <Link to='/login'
                                                                                                          className="fw-semibold text-primary text-decoration-underline"> Click
                                                    here </Link></p>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </div>
                            </Col>{/*end col*/}
                        </Row>{/*end row*/}
                    </Container>{/*end container*/}
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
    )
}

export default Passwordreset;
