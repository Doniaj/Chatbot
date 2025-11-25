import React, {useEffect, useState} from "react";
import SimpleBar from "simplebar-react";
//import logo
import logo from "assets/images/logoPRDV.png";
import logoSm from "assets/images/logoPRDV.png";

//Import Components
import VerticalLayout from "./VerticalLayouts";
import TwoColumnLayout from "./TwoColumnLayout";
import {Button, Container} from "react-bootstrap";
import HorizontalLayout from "./HorizontalLayout";
import {apiImageUrl} from "../../configs/site.config";
import {GetUserInfo, setCryptedLocalStorage} from "../../helpers/stringHelper";
import EfilesApiService from "../../util/services/EfilesApiService";
import {NotifyError} from "../../util/alerte_extensions/AlertsComponents";
import {loginSuccess} from "../../slices/auth/login/reducer";
import {Dispatch} from "redux";
import {useDispatch} from "react-redux";
import {NotifySuccess} from "../../Common/Toast";
import {Link} from "react-router-dom";

const Sidebar = () => {
    const [selectedImage, setSelectedImage] = useState<any>(null)
    const [uploadedFile, setUploadedFile] = useState<any>(null)
    const [currentUser, setCurrentUser] = useState<any>(GetUserInfo())
    const dispatch: Dispatch<any> = useDispatch()

    useEffect(() => {
        var verticalOverlay = document.getElementsByClassName("vertical-overlay");
        if (verticalOverlay) {
            verticalOverlay[0].addEventListener("click", function () {
                document.body.classList.remove("vertical-sidebar-enable");
            });
        }
    });

    const addEventListenerOnSmHoverMenu = () => {
        // add listener Sidebar Hover icon on change layout from setting
        if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover') {
            document.documentElement.setAttribute('data-sidebar-size', 'sm-hover-active');
        } else if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover-active') {
            document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
        } else {
            document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
        }
    };
    return (
        <React.Fragment>
            <div className="app-menu navbar-menu">
                <div className="navbar-brand-box">
                    <Link to="/" className="logo logo-dark">
            <span className="logo-sm">
              <img src={logoSm} alt="" height="26"/>
            </span>
                        <span className="logo-lg">
              <img src={logo} alt="" height="26"/>
            </span>
                    </Link>

                    <Link to="/" className="logo logo-light">
            <span className="logo-sm">
              <img src={logoSm} alt="" height="24"/>
            </span>
                        <span className="logo-lg">
              <img src={logo} alt="" height="24"/>
            </span>
                    </Link>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={addEventListenerOnSmHoverMenu}
                        type="button"
                        className="p-0 fs-20 header-item float-end btn-vertical-sm-hover"
                        id="vertical-hover"
                    >
                        <i className="ri-record-circle-line"></i>
                    </Button>
                </div>
                <React.Fragment>
                    <SimpleBar id="scrollbar" className="h-100">
                        <Container fluid>
                            <div id="two-column-menu"></div>
                            <ul className="navbar-nav" id="navbar-nav">
                                <VerticalLayout/>
                            </ul>
                        </Container>
                    </SimpleBar>
                    <div className="sidebar-background"></div>
                </React.Fragment>
            </div>
            <div className="vertical-overlay"></div>
        </React.Fragment>
    );
};

export default Sidebar;
