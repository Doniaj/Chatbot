import React from "react";
import "assets/scss/components/skeleton/_sub_categories.css"
const SkeletonTable = ({numberOfRows}: any) => {
    return (
        <>
            {
                [...Array(numberOfRows)].map((e, i) => (
                    <div>
                        <div className="row_skeleton">
                            <div className="skeleton"></div>
                            <div className="skeleton"></div>
                            <div className="skeleton"></div>
                            <div className="skeleton"></div>
                        </div>
                    </div>
                ))
            }
        </>
    )


}

export default SkeletonTable