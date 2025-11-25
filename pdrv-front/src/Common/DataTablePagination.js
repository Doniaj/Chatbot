//Pagination
import React from 'react'
import  ReactPaginate  from 'react-paginate'


export const DataTablePagination = ({forcePage, pageCount, handlePagination, sortBy, sortDir}) => {
    const OnchangePage = (page) => {
        handlePagination(page, sortBy, sortDir)
    }
    return (
        <div>
            <ReactPaginate
                previousLabel='previous'
                nextLabel='next'
                forcePage={forcePage}
                onPageChange={page =>OnchangePage(page)}
                pageCount={pageCount}
                breakLabel='...'
                pageRangeDisplayed={5}
                marginPagesDisplayed={5}
                activeClassName='active'
                pageClassName='page-item'
                nextLinkClassName='page-link'
                nextClassName='page-item next'
                previousClassName='page-item prev'
                previousLinkClassName='page-link'
                pageLinkClassName='page-link'
                breakClassName='page-item'
                breakLinkClassName='page-link'
                containerClassName='pagination react-paginate separated-pagination pagination-sm justify-content-end pr-1 mt-1'
            />
        </div>
    )
}
