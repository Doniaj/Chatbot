//Include Both Helper File with needed methods
import {apiError, loginSuccess, logoutUserSuccess, reset_login_flag, changeUserRoleAction} from './reducer';
import usersApiService from "../../../util/services/UsersApiService";
import {clearUser, setCryptedLocalStorage} from "../../../helpers/stringHelper";
import siteConfig from "../../../configs/site.config";


export const loginUser = (user: any, router: any) => async (dispatch: any) => {

    try {
        usersApiService.SignIn(user).then((result: any) => {
            let data = result?.data
            if (result.data.success) {
                const user_info = result?.data?.user
                const prefix = (user_info?.first_name ? user_info?.first_name.charAt(0) : '').toUpperCase() + (user_info?.last_name ? user_info?.last_name.charAt(0) : '');
                const user = {
                    user_id: user_info?.user_id,
                    username: user_info?.username,
                    fullname: user_info?.first_name + ' ' + user_info?.last_name,
                    prefix: prefix,
                    email: user_info?.email,
                    first_name: user_info?.first_name,
                    last_name: user_info?.last_name,
                    role_id: user_info?.role_id,
                    role: user_info?.role?.role_name?.toUpperCase(),
                    created_at: user_info?.created_at,
                    address: user_info?.address,
                    phone_number: user_info?.phone_number,
                    is_verified: user_info.is_verified,
                }
                dispatch(loginSuccess({user}))
                localStorage.setItem('token', result.data.token);
                setCryptedLocalStorage('currentuser', user)
                dispatch(changeUserRoleAction(user?.role))
                return router("/")

            } else {
                return dispatch(apiError(data?.message));
            }
        }).catch((err: any) => {
            return dispatch(apiError(err));
        })
    } catch (error) {
        return dispatch(apiError(error));
    }
};

export const logoutUser = () => async (dispatch: any) => {
    try {
        clearUser()
        dispatch(logoutUserSuccess(true));
        return window.location.href = siteConfig.App_Base_URL + 'login';
    } catch (error) {
        dispatch(apiError(error));
    }
};


export const resetLoginFlag = () => async (dispatch: any) => {
    try {
        const response = dispatch(reset_login_flag());
        return response;
    } catch (error) {
        dispatch(apiError(error));
    }
};
