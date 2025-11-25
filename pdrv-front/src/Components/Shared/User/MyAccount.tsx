import React, {useEffect, useState} from "react";
import {Col, Container, Row, Tab, Nav, Card, Image} from "react-bootstrap";
import { Link } from "react-router-dom";
import avatar from "assets/images/logoPRDV.png";
import {apiImageUrl} from "../../../configs/site.config";
import {useStore} from "react-redux";
import AccountInfo from "./ProfileTabs/AccountInfo";
import AccountSettings from "./ProfileTabs/AccountSettings";
import AccountPassword from "./ProfileTabs/AccountPassword";
import WorkingHoursSettings from "./ProfileTabs/WorkingHoursSettings";
import {GetUserInfo} from "../../../helpers/stringHelper";
import { withTranslation} from "react-i18next";
import withRouter from "../../../Common/withRouter";

const MyAccount = (props : any) => {
    const [userData , setUserData] = useState(GetUserInfo())
    const store = useStore<any>();
    useEffect(() => {
        const user: any = store.getState().Login.user || {}
        if(user && Object.keys(user).length !== 0){
            setUserData(user)
        }
    },[])
    document.title = props.t('user-settings');
    return (
        <React.Fragment>
            <section className="position-relative">
                <div className="profile-basic position-relative bg-dark" style={{ backgroundSize: "cover", backgroundPosition: "center", height: "300px" }}>
                    <div className="bg-overlay bg-primary"
                    ></div>
                </div>
                <Container>
                    <Row>
                        <Col lg={12} >
                            <div className="pt-3">
                                <div className="mt-n5 d-flex gap-3 flex-wrap align-items-end">
                                    <Image src={userData?.profile_image_id ? apiImageUrl + userData?.profile_image_id : avatar} alt="" className="avatar-xl p-1 bg-light mt-n3" rounded />
                                    <div>
                                        <h5 className="fs-18">{userData.fullname}</h5>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
            <section className="py-5">
                <Container>
                    <Tab.Container id="left-tabs-example" defaultActiveKey="profile">
                        <Row>
                            <Col lg={3}>
                                <Card>
                                    <Card.Body>
                                        <Nav variant="pills" className="flex-column gap-3">
                                            <Nav.Item as='li'>
                                                <Nav.Link as="a" eventKey="profile" className="fs-15" role="presentation">
                                                    <i className="bi bi-person-circle align-middle me-1"></i> {props.t('account-info')}
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item as='li'>
                                                <Nav.Link as="a" eventKey="setting" className="fs-15" role="presentation">
                                                    <i className="bi bi-gear align-middle me-1"></i> {props.t('settings')}
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item as='li'>
                                                <Nav.Link as="a" eventKey="Working hours and Duration setting" className="fs-15" role="presentation">
                                                    <i className="bi bi-clock align-middle me-1"></i> {props.t('working-hours-and-duration-setting')}
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item as='li'>
                                                <Nav.Link as="a" eventKey="change-password" className="fs-15" role="presentation">
                                                    <i className="bi bi-key-fill align-middle me-1"></i> {props.t('change-password')}
                                                </Nav.Link>
                                            </Nav.Item>
                                        </Nav>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col sm={9}>
                                <Tab.Content>
                                    <Tab.Pane eventKey="profile">
                                        <AccountInfo props={props}/>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="setting">
                                        <AccountSettings setUserData={setUserData} props={props}/>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="change-password">
                                        <AccountPassword props={props}/>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="Working hours and Duration setting">
                                        <WorkingHoursSettings />
                                    </Tab.Pane>
                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>
                </Container>
            </section>
        </React.Fragment >
    )
}

export default withRouter(withTranslation()(MyAccount));