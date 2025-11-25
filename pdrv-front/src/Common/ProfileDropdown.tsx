import React from 'react';
import {Dropdown} from 'react-bootstrap';
import {useDispatch, useStore} from 'react-redux';
//import images
import avatar from "assets/images/logoPRDV.png";
import {logoutUser} from "../slices/auth/login/thunk";
import {GetUserInfo} from "../helpers/stringHelper";
import {apiImageUrl} from "../configs/site.config";

const ProfileDropdown = (props: any) => {
    let Props = props.props;
    const store = useStore<any>();
    const user: any = store.getState().Login.user || GetUserInfo()
    const dispatch = useDispatch<any>();
    const LogOut = () => {
        dispatch(logoutUser())
    }

    return (
        <React.Fragment>
            <Dropdown className="ms-sm-3 header-item topbar-user">
                <Dropdown.Toggle type="button" className="btn bg-transparent border-0 arrow-none"
                                 id="page-header-user-dropdown">
                    <span className="d-flex align-items-center">
                        <img className="rounded-circle header-profile-user"
                             src={user?.profile_image_id ? apiImageUrl + user?.profile_image_id : avatar}
                             alt="Header Avatar"/>
                        <span className="text-start ms-xl-2">
                            <span
                                className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{user?.fullname}</span>
                            <span
                                className="d-none d-xl-block ms-1 fs-13 text-muted user-name-sub-text">{Props.t((user?.role).toLowerCase())}</span>
                        </span>
                    </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-end">
                    <h6 className="dropdown-header">{Props.t('welcome')} {user?.fullname}!</h6>
                    <div className="dropdown-divider"></div>
                    <Dropdown.Item href="/user-settings"><i
                        className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i> <span
                        className="align-middle">{Props.t('settings')}</span></Dropdown.Item>
                    <Dropdown.Item onClick={() => LogOut()}><i
                        className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span
                        className="align-middle" data-key="t-logout">{Props.t('logout')}</span></Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </React.Fragment>
    );
}

export default ProfileDropdown;
