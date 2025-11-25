import {Card, Col, Row, Table} from "react-bootstrap";
import moment from "moment/moment";
import React from "react";
import {useStore} from "react-redux";
import {GetUserInfo, PhoneNumbers} from "../../../../helpers/stringHelper";

const AccountInfo = (props : any) => {
    let Props = props.props
    const store = useStore<any>();
    const user: any = store.getState().Login.user || {}
    const userInfo = user? user : GetUserInfo()
    return (
        <div className="tab-pane fade show active" id="custom-v-pills-profile" role="tabpanel">
            <Row>
                <Col lg={12}>
                    <Card >
                        <Card.Body >

                            <div className="d-flex mb-4">
                                <h6 className="fs-16 text-decoration-underline flex-grow-1 mb-0">{Props.t('personal-info')}</h6>
                            </div>

                            <div className="table-responsive table-card px-1">
                                <Table className="table-borderless table-sm">
                                    <tbody>
                                    <tr>
                                        <td>
                                            {Props.t('fullname')}
                                        </td>
                                        <td className="fw-medium">
                                            {userInfo?.fullname}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            {Props.t('phone-number')}
                                        </td>
                                        <td className="fw-medium">
                                            {/*{PhoneNumbers(userInfo)}*/}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            {Props.t('email')}
                                        </td>
                                        <td className="fw-medium">
                                            {userInfo?.email}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            {Props.t('since-member')}
                                        </td>
                                        <td className="fw-medium">
                                            {moment(userInfo.created_at).format('ll')}
                                        </td>
                                    </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
export default AccountInfo;