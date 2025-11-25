import React from 'react';
import {Button, Col, Row} from 'react-bootstrap';

const Pagination = ({
                        pagination,
                        pageNumbers,
                        currentPage,
                        handleprevPage,
                        handleClick,
                        handlenextPage,
                        props
                    }: any) => {
    const renderPageButtons = () => {
        return Array.from({length: pageNumbers}, (_, index) => {
            const pageNum = index + 1;
            const isActive = pageNum === currentPage;
            const isInRange = pageNum >= currentPage - 1 && pageNum <= currentPage + 1;

            return (
                <>
                    {
                        isInRange && <React.Fragment key={pageNum}>
                            <div
                                className={isActive ? "page-item active" : "page-item"}
                            >
                                <Button variant="link" className="page-link clickPageNumber" id={pageNum.toString()}
                                        onClick={handleClick}>
                                    {pageNum}
                                </Button>
                            </div>
                        </React.Fragment>
                    }
                </>
            );
        });
    };
    return (
        <React.Fragment>
            {pagination && <Row className="mb-4" id="pagination-element">
                <Col lg={12}>
                    <div
                        className="pagination-block pagination pagination-separated justify-content-center justify-content-sm-end mb-sm-0">
                        {currentPage > 1 && (
                            <div className={currentPage <= 1 ? "page-item disabled" : "page-item"}>
                                <Button variant="link" href="#" className="page-link" id="page-prev"
                                        onClick={(e) => handleprevPage(e)}>{props.t('previous')}</Button>
                            </div>
                        )}

                        <span id="page-num" className="pagination">
                            {
                                currentPage - 1 > 1 && <React.Fragment key={1}>
                                    <div
                                        className={"page-item"}
                                    >
                                        <Button variant="link" className="page-link clickPageNumber" id={(1).toString()}
                                                onClick={handleClick}>
                                            {1}
                                        </Button>
                                    </div>
                                </React.Fragment>
                            }
                            {
                                currentPage > 3 && <React.Fragment key={2}>
                                    <div
                                        className={"page-item"}
                                    >
                                        <Button variant="link" className="page-link clickPageNumber" id={(2).toString()}
                                                onClick={handleClick}>
                                            {'...'}
                                        </Button>
                                    </div>
                                </React.Fragment>
                            }
                            {renderPageButtons()}
                            {
                                currentPage + 2 < pageNumbers && <React.Fragment key={pageNumbers - 1}>
                                    <div
                                        className={"page-item"}
                                    >
                                        <Button variant="link" className="page-link clickPageNumber"
                                                id={(pageNumbers - 1).toString()}
                                                onClick={handleClick}>
                                            {'...'}
                                        </Button>
                                    </div>
                                </React.Fragment>
                            }
                            {
                                currentPage + 2 <= pageNumbers && <React.Fragment key={pageNumbers}>
                                    <div
                                        className={"page-item"}
                                    >
                                        <Button variant="link" className="page-link clickPageNumber"
                                                id={(pageNumbers).toString()}
                                                onClick={handleClick}>
                                            {pageNumbers}
                                        </Button>
                                    </div>
                                </React.Fragment>
                            }

                        </span>
                        {currentPage < pageNumbers && (
                            <div className={currentPage >= pageNumbers ? "page-item disabled" : "page-item"}>
                                <Button variant="link" href="#" className="page-link" id="page-next"
                                        onClick={(e) => handlenextPage(e)}>{props.t('next')}</Button>
                            </div>
                        )}

                    </div>
                </Col>
            </Row>}
        </React.Fragment>
    );
}

export default Pagination;