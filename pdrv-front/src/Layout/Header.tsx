import React, {useEffect} from 'react';
import FullScreenDropdown from '../Common/FullScreenDropdown';
import ProfileDropdown from '../Common/ProfileDropdown';
import LayoutModeDropdown from 'Common/LayoutModeDropdown';
import {Button} from 'react-bootstrap';
import {Link} from 'react-router-dom';

//import images

import logoPRDV from "../assets/images/logoPRDV.png";
import logodark from "../assets/images/logo-dark.png";
import logolight from "../assets/images/logo-light.png";
import {useStore} from "react-redux";
import {apiImageUrl} from "../configs/site.config";
import logo from "assets/images/marketplace-logo.png";

const toogleMenuBtn = () => {

    var windowSize = document.documentElement.clientWidth;

    if (windowSize > 767)
        document.querySelector(".hamburger-icon")?.classList.toggle('open');

    //For collapse horizontal menu
    if (document.documentElement.getAttribute('data-layout') === "horizontal") {
        document.body.classList.contains("menu") ? document.body.classList.remove("menu") : document.body.classList.add("menu");
    }

    //For collapse vertical menu
    if (document.documentElement.getAttribute('data-layout') === "vertical") {
        if (windowSize < 1025 && windowSize > 767) {
            document.body.classList.remove('vertical-sidebar-enable');
            (document.documentElement.getAttribute('data-sidebar-size') === 'sm') ? document.documentElement.setAttribute('data-sidebar-size', '') : document.documentElement.setAttribute('data-sidebar-size', 'sm');
        } else if (windowSize > 1025) {
            document.body.classList.remove('vertical-sidebar-enable');
            (document.documentElement.getAttribute('data-sidebar-size') === 'lg') ? document.documentElement.setAttribute('data-sidebar-size', 'sm') : document.documentElement.setAttribute('data-sidebar-size', 'lg');
        } else if (windowSize <= 767) {
            document.body.classList.add('vertical-sidebar-enable');
            document.documentElement.setAttribute('data-sidebar-size', 'lg');
        }
    }

    //Two column menu
    if (document.documentElement.getAttribute('data-layout') === "twocolumn") {
        document.body.classList.contains('twocolumn-panel') ? document.body.classList.remove('twocolumn-panel') : document.body.classList.add('twocolumn-panel');
    }

};

const Header = (props: any) => {
    let Props = props.props;
    const store = useStore<any>();

    useEffect(() => {
        const user: any = store.getState()?.auth?.user || {}
        let link = document.querySelector("link[rel~='icon']") as HTMLAnchorElement | null;
        if (link && link.href) {
            link.href = user?.logo_id ? apiImageUrl + user?.logo_id : logo;
        }
    })
    return (
        <React.Fragment>
            <header id="page-topbar">
                <div className="layout-width">
                    <div className="navbar-header">
                        <div className="d-flex">
                            <div className="navbar-brand-box horizontal-logo">
                                <Link to="/" className="logo logo-dark">
                                <span className="logo-sm">
                                    <img src={logoPRDV} alt="" height="22"/>
                                </span>
                                    <span className="logo-lg">
                                    <img src={logodark} alt="" height="25"/>
                                </span>
                                </Link>

                                <Link to="/" className="logo logo-light">
                                <span className="logo-sm">
                                    <img src={logoPRDV} alt="" height="22"/>
                                </span>
                                    <span className="logo-lg">
                                    <img src={logolight} alt="" height="25"/>
                                </span>
                                </Link>
                                /**
                            </div>

                            <Button variant="link" size="sm" type="button"
                                    className="px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                                    id="topnav-hamburger-icon"
                                    onClick={toogleMenuBtn}
                            >
                                <span className="hamburger-icon">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </Button>
                        </div>


                        <div className="d-flex align-items-center">

                            <div className="d-md-none topbar-head-dropdown header-item">
                                <button type="button" className="btn btn-icon btn-topbar btn-ghost-dark rounded-circle"
                                        id="page-header-search-dropdown" data-bs-toggle="modal"
                                        data-bs-target="#searchModal">
                                    <i className="bi bi-search fs-16"></i>
                                </button>
                            </div>
                            <FullScreenDropdown/>
                            <LayoutModeDropdown/>
                            <ProfileDropdown props={Props}/>
                        </div>
                    </div>
                </div>
            </header>
        </React.Fragment>
    );
}

export default Header;
