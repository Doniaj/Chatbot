import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import AlertWithLoader from "./Alert";

const Layout = ({children, props}: any) => {
    return (
        <React.Fragment>
            <div id="layout-wrapper">
                <Header props={props}/>
                <Sidebar/>
                <div className="main-content">
                    <AlertWithLoader />
                    {children}
                </div>
            </div>
        </React.Fragment>
    );
}

export default Layout;