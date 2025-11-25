import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Image, Row, Spinner } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import auth1 from "assets/images/logoPRDV.png";
import usersApiService from "../../../util/services/UsersApiService";
import siteConfig from "../../../configs/site.config";

const Passwordcreate = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [passwordChanged, setIsPasswordChanged] = useState<boolean>(false);
    const [typeMessage, setTypeMessage] = useState<string>("danger");
    const [message, setMessage] = useState<string>("");
    const location = useLocation();
    const [loader, setLoader] = useState<boolean>(false);

    const queryParameters = new URLSearchParams(location.search);

    const formik = useFormik({
        initialValues: {
            password: "",
            confirmPassword: "",
        },
        validationSchema: Yup.object({
            password: Yup.string()
                .min(8, "Password must be at least 8 characters")
                .matches(/.*[a-z].*/, "At least one lowercase letter required")
                .matches(/.*[A-Z].*/, "At least one uppercase letter required")
                .matches(/.*[0-9].*/, "At least one number required")
                .required("This field is required"),
            confirmPassword: Yup.string()
                .required("This field is required")
                .oneOf([Yup.ref("password")], "Passwords do not match"),
        }),
        onSubmit: (values) => {
            setLoader(true);
            let token = queryParameters.get("token");

            if (!token) {
                setLoader(false);
                setIsValidToken(false);
                setMessage("Invalid reset password link");
                return;
            }

            usersApiService
                .resetPassword({ token, password: values.password })
                .then((result: any) => {
                    setLoader(false);
                    if (result.data.success) {
                        setMessage("Password changed successfully! Please login to your account.");
                        setTypeMessage("success");
                        setIsPasswordChanged(true);
                    } else {
                        setIsValidToken(false);
                        setMessage(result.data.message || "Sorry, your reset password link is no longer valid. You can request another one below");
                        setTypeMessage("danger");
                    }
                })
                .catch((error) => {
                    console.error("Reset password error:", error);
                    setLoader(false);
                    setIsValidToken(false);
                    setMessage("Sorry, your reset password link is no longer valid. You can request another one below");
                    setTypeMessage("danger");
                });
        },
    });

    useEffect(() => {
        verifyTokenValidation();
    }, []);

    const verifyTokenValidation = () => {
        let token = queryParameters.get("token");
        if (!token) {
            setIsValidToken(false);
            setMessage("Invalid reset password link - no token provided");
            return;
        }

        usersApiService
            .VerifyResetToken({ token })
            .then((result: any) => {
                if (result?.data?.success) {
                    setIsValidToken(true);
                    setMessage("");
                } else {
                    setIsValidToken(false);
                    setMessage(result?.data?.message || "Sorry, your reset password link is no longer valid. You can request another one below");
                }
            })
            .catch((error) => {
                console.error("Token verification error:", error);
                setIsValidToken(false);
                setMessage("Sorry, your reset password link is no longer valid. You can request another one below");
            });
    };

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleToggleConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <React.Fragment>
            <section className="auth-page-wrapper position-relative bg-light min-vh-100 d-flex align-items-center justify-content-between">
                <div className="w-100">
                    <Container>
                        <Row className="justify-content-center">
                            <Col lg={6}>
                                <div className="auth-card mx-lg-3">
                                    <Card className="border-0 mb-0">
                                        <Card.Header className="bg-primary border-0">
                                            <Row>
                                                <Col lg={4} xs={3}>
                                                    <Image src={auth1} alt="" className="img-fluid" />
                                                </Col>
                                                <Col lg={8} xs={9}>
                                                    <h1 className="text-white lh-base fw-lighter">Reset Password</h1>
                                                </Col>
                                            </Row>
                                        </Card.Header>
                                        <Card.Body>
                                            {/* Loader while checking token */}
                                            {isValidToken === null ? (
                                                <div className="text-center p-4">
                                                    <Spinner animation="border" />
                                                    <p className="mt-2">Verifying reset link...</p>
                                                </div>
                                            ) : !isValidToken || passwordChanged ? (
                                                <>
                                                    <Alert
                                                        className={`alert-borderless alert-${typeMessage} text-center mb-2 mx-2`}
                                                        role="alert"
                                                    >
                                                        {message}
                                                    </Alert>
                                                    <div className="mt-4">
                                                        <Link
                                                            to={passwordChanged ? "/login" : "/forgetPassword"}
                                                            className="w-100 btn btn-primary"
                                                            type="submit"
                                                        >
                                                            {passwordChanged ? "Go to Login" : "Request New Reset Link"}
                                                        </Link>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="p-2">
                                                    <div className="mb-3">
                                                        <p className="text-muted">Please enter your new password below.</p>
                                                    </div>
                                                    <Form onSubmit={formik.handleSubmit}>
                                                        <div className="mb-3">
                                                            <Form.Label htmlFor="password-input">New Password</Form.Label>
                                                            <div className="position-relative auth-pass-inputgroup">
                                                                <Form.Control
                                                                    type={showPassword ? "text" : "password"}
                                                                    className="pe-5 password-input"
                                                                    placeholder="Enter new password"
                                                                    id="password-input"
                                                                    name="password"
                                                                    onChange={formik.handleChange}
                                                                    value={formik.values.password}
                                                                    onBlur={formik.handleBlur}
                                                                    isInvalid={!!(formik.errors.password && formik.touched.password)}
                                                                />
                                                                <Button
                                                                    className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon"
                                                                    style={{ zIndex: 10, border: 'none', background: 'transparent' }}
                                                                    onClick={handleTogglePassword}
                                                                    type="button"
                                                                >
                                                                    <i className={showPassword ? "ri-eye-off-fill align-middle" : "ri-eye-fill align-middle"} />
                                                                </Button>
                                                                {formik.errors.password && formik.touched.password && (
                                                                    <Form.Control.Feedback type="invalid">
                                                                        {formik.errors.password}
                                                                    </Form.Control.Feedback>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <Form.Label htmlFor="confirm-password-input">Confirm New Password</Form.Label>
                                                            <div className="position-relative auth-pass-inputgroup">
                                                                <Form.Control
                                                                    type={showConfirmPassword ? "text" : "password"}
                                                                    className="pe-5 password-input"
                                                                    placeholder="Confirm new password"
                                                                    id="confirm-password-input"
                                                                    name="confirmPassword"
                                                                    value={formik.values.confirmPassword}
                                                                    onChange={formik.handleChange}
                                                                    onBlur={formik.handleBlur}
                                                                    isInvalid={!!(formik.errors.confirmPassword && formik.touched.confirmPassword)}
                                                                />
                                                                <Button
                                                                    className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon"
                                                                    style={{ zIndex: 10, border: 'none', background: 'transparent' }}
                                                                    onClick={handleToggleConfirmPassword}
                                                                    type="button"
                                                                >
                                                                    <i className={showConfirmPassword ? "ri-eye-off-fill align-middle" : "ri-eye-fill align-middle"} />
                                                                </Button>
                                                                {formik.errors.confirmPassword && formik.touched.confirmPassword && (
                                                                    <Form.Control.Feedback type="invalid">
                                                                        {formik.errors.confirmPassword}
                                                                    </Form.Control.Feedback>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mt-4">
                                                            <Button
                                                                variant="primary"
                                                                className="w-100"
                                                                type="submit"
                                                                disabled={loader || !formik.isValid}
                                                            >
                                                                {loader && <Spinner size="sm" animation="border" className="me-2" />}
                                                                {loader ? "Resetting Password..." : "Reset Password"}
                                                            </Button>
                                                        </div>
                                                    </Form>
                                                </div>
                                            )}
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
                                        <p className="mb-0 text-muted">
                                            © {new Date().getFullYear()} {siteConfig.siteName}. Crafted with{" "}
                                            <i className="mdi mdi-heart text-danger"></i> by {siteConfig.siteCreator}
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

export default Passwordcreate;