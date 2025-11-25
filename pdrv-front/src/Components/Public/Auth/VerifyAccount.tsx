import React, {useEffect, useState} from 'react';
import {Alert, Button, Card, Col, Container, Form, Row, Spinner} from 'react-bootstrap';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import logoSm from "assets/images/logo-sm.png"
import withRouter from 'Common/withRouter';
import loading from "assets/images/auth/loading.gif"
import error from "assets/images/auth/error.png"
import done from "assets/images/auth/done.png"
import usersApiService from "../../../util/services/UsersApiService";
import siteConfig from "../../../configs/site.config";

const VerifyAccount = (props: any) => {

document.title = "Verify Account";

    const [textMessage, setTextMessage] = useState<string>("Verifying Account...");
    const [showButton, setShowButton] = useState<boolean>(false);
    const [loader, setLoader] = useState<any>("loading");
    const location = useLocation()
    const queryParameters = new URLSearchParams(location.search)
    const token = queryParameters.get("token")
    const navigate = useNavigate()
    useEffect(() => {
        if(token){
            usersApiService.verifyTokenParams({token, type : "activation"}).then((data : any) => {
                if(data?.data?.success){
                    setLoader("done");
                    setTextMessage(data?.data?.message);
                    setShowButton(true)
                    setTimeout(() => navigate('/login', {state: {verified : true, message : "Account Verified Successfully, Please Login !"}}), 500);
                }else{
                    setLoader("error");
                    setTextMessage(data?.data?.message);
                    setShowButton(true)
                }
            }).catch(err => {
                setLoader("error");
                setTextMessage("Something went wrong!, Please try again later.");
                setShowButton(true)
            })
        }
    }, [token]);
    return (
        <React.Fragment>
            <section className="auth-page-wrapper position-relative bg-light min-vh-100 d-flex align-items-center justify-content-between">
                <div className="w-100">
                    <Container>
                        <Row className="justify-content-center">
                            <Col lg={6}>
                                <div className="mx-lg-3">
                                    <Card className="border-0 mb-0">
                                        <Card.Header className="border-0 text-center">
                                                    <img src={loader === "loading" ? loading : loader === 'done' ? done : error} alt="" width={loader === "done" ? "250px" : "200px"} className="img-fluid"/>
                                        </Card.Header>
                                        <Card.Body className="text-center">
                                            <p className="text-muted fs-15">{textMessage}</p>

                                            {showButton && <div>
                                                <Link to="/login" className="btn btn-success w-100">Back to
                                                    Login</Link>
                                            </div>}
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

export default withRouter(VerifyAccount);
