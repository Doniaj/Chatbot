import React, {useEffect} from 'react';
import {useNavigate, Route, Routes, Navigate} from 'react-router-dom';
import LayoutAdmin from '../Layout/admin';
import NonAuthLayout from 'Layout/admin/NonAuthLayout';
//routes
import {adminProtectedRoutes, sharedProtectedRoutes, supAdminProtectedRoutes} from "./allRoutes";
import {publicRoutes} from "./allRoutes";
import BaseApiService from '../util/services/BaseApiService'
import {GetUserInfo, isUserLoggedIn, clearUser, setCryptedLocalStorage} from "../helpers/stringHelper";
import UsersApiService from "../util/services/UsersApiService";
import {loginSuccess} from 'slices/auth/login/reducer';
import {useDispatch} from "react-redux";
import {Dispatch} from "redux";
import withRouter from "../Common/withRouter";
import {withTranslation} from "react-i18next";
import Layout from "../Layout";
import {USER_ROLE} from "../Common/constants";

const Index = (props: any) => {

    const navigate = useNavigate()
    const current_user = GetUserInfo()
    let baseApi = new BaseApiService()
    const dispatch: Dispatch<any> = useDispatch()

    useEffect(() => {
        verifyToken()
        getCurrentUser()
    }, []);
    const getCurrentUser = () => {
        let route = window.location.pathname
        let first_index = route.indexOf("/");
        let second_index = route.lastIndexOf("/");
        let current_path = '';
        let publicRoutesPaths = publicRoutes.map(path => path.path)
        if (first_index !== second_index) {
            current_path = route.substring(
                first_index + 1,
                getPosition(route, '/', 2)
            );
        } else {
            current_path = route.replace('/', '');
        }
        if (!publicRoutesPaths.includes('/' + current_path)) {
            UsersApiService.getCurrentUser().then((result: any) => {
                let Data = result?.data
                if (Data?.success) {
                    dispatch(loginSuccess({user: Data?.user}))
                    setCryptedLocalStorage('currentuser', Data?.user)
                } else {
                    clearUser()
                    console.log("here1")
                    return <Navigate to='/login'/>
                }
            }).catch(() => {
                clearUser()
                console.log("here2")
                return <Navigate to='/login'/>
            })
        }

    }
    const FinalRoute = (x: any) => {
        let route = x.route
        if (
            !isUserLoggedIn()
        ) {
            console.log("here3")
            return <Navigate to='/login'/>
        }
        else {
            return <Layout props={props}>{route.component}</Layout>
        }

    }
    const ResolveRoutes = () => {
        if((current_user?.role || "").toLowerCase() === USER_ROLE.ADMIN){
            return ([...adminProtectedRoutes, ...sharedProtectedRoutes].map((route, idx) => {
                return (<Route
                    path={route.path}
                    element={
                        <FinalRoute route={route}/>
                    }
                    key={idx}
                />)

            }))
        }else if ((current_user?.role || "").toLowerCase() === USER_ROLE.SUPADMIN){
            return ([...supAdminProtectedRoutes, ...sharedProtectedRoutes].map((route, idx) => {
                return (<Route
                    path={route.path}
                    element={
                        <FinalRoute route={route}/>
                    }
                    key={idx}
                />)

            }))
        }
    }
    const FinalRoutePublic = (x: any) => {
        let route = x.route
        if (isUserLoggedIn()) {
            console.log("here4")
            return <Navigate to='/login'/>
        } else {
            return <NonAuthLayout> {route.component} </NonAuthLayout>
        }

    }
    const ResolvePublicRoutes = () => {
        return (publicRoutes.map((route, idx) => {
            return (<Route
                key={idx}
                path={route.path}
                element={<FinalRoutePublic route={route}/>}
            />)

        }))
    }

    function getPosition(string: string, subString: any, index: number) {
        return string.split(subString, index).join(subString).length;
    }

    const verifyToken = () => {
        const Token = localStorage.getItem('token');
        let route = window.location.pathname
        let first_index = route.indexOf("/");
        let second_index = route.lastIndexOf("/");
        let current_path = '';
        let publicRoutesPaths = publicRoutes.map(path => path.path)
        if (first_index !== second_index) {
            current_path = route.substring(
                first_index + 1,
                getPosition(route, '/', 2)
            );
        } else {
            current_path = route.replace('/', '');
        }
        if (Token === 'null' || !Token) {
            clearUser()
            if (!publicRoutesPaths.includes('/' + current_path)) {
                console.log("here5")
                navigate('/login')
            }
        } else {
            let params = {
                token: Token,
                user_id: current_user?.user_id
            }
            baseApi.verifyToken(params).then((res: any) => {
                if (!res?.data?.success) {
                    localStorage.clear();
                    console.log("here6")
                    navigate('/login')
                }
            }).catch(err => {
                localStorage.clear();
                if (!publicRoutesPaths.includes('/' + current_path)) {
                    console.log("here7")
                    navigate('/login')
                }
            })
        }
    }
    return (
        <React.Fragment>
            <Routes>
                {ResolveRoutes()}
                {ResolvePublicRoutes()}
            </Routes>
        </React.Fragment>
    );


}

export default withRouter(withTranslation()(Index));

