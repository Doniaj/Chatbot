import React from 'react';
import { Link } from 'react-router-dom';
import { Col, Row } from 'react-bootstrap';

interface BreadCrumbProps {
    title? : string;
    ParentTitle? : string;
    LinkParentTitle? : string;
    ChildTitle? : string;
    LinkChildTitle? : string;
    pageTitle? : string;
    props? : any;
}
const BreadCrumb = ({ ParentTitle,LinkParentTitle,ChildTitle, LinkChildTitle, title, props  } : BreadCrumbProps) => {
    return (
        <React.Fragment>
            <Row>
                <Col xs={12}>
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">{props.t(title)}</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item fw-bold"><Link to={LinkParentTitle || '#'}>{props.t(ParentTitle)}</Link></li>
                                <li className="breadcrumb-item active"><Link to={LinkChildTitle || '#'}>{props.t(ChildTitle || ParentTitle)}</Link></li>
                            </ol>
                        </div>

                    </div>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default BreadCrumb;