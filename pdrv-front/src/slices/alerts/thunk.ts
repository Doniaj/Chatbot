import {
    changeAlertAction,
    dangerAlertAction,
    successAlertAction,
    warningAlertAction,
    dismissAlertAction,
    primaryAlertAction
} from './reducer';

/**
 * Changes the layout type
 * @param {*} param0
 */
export const changeAlert = (alert: any) => async (dispatch: any) => {
    try {
        dispatch(dismissAlertAction()); // Set state to false
        setTimeout(() => {
            dispatch(changeAlertAction(alert));
        }, 200);
    } catch (error) { }
};
/**
 * Changes the layout type
 * @param {*} param0
 */
export const dangerAlert = (message : any) => async (dispatch: any) => {
    try {
        dispatch(dismissAlertAction()); // Set state to false
        setTimeout(() => {
            dispatch(dangerAlertAction(message));
            setTimeout(() => {
                dispatch(dismissAlertAction());
            }, 2000);
        }, 200);
    } catch (error) { }
};
/**
 * Changes the layout type
 * @param {*} param0
 */
export const primaryAlert = (message : any) => async (dispatch: any) => {
    try {
        dispatch(dismissAlertAction()); // Set state to false
        setTimeout(() => {
            dispatch(primaryAlertAction(message));
            setTimeout(() => {
                dispatch(dismissAlertAction());
            }, 2000);
        }, 200);
    } catch (error) { }
};
/**
 * Changes the layout type
 * @param {*} param0
 */
export const successAlert = (alert: any) => async (dispatch: any) => {
    try {
        dispatch(dismissAlertAction()); // Set state to false
        setTimeout(() => {
            dispatch(successAlertAction(alert));
            setTimeout(() => {
                dispatch(dismissAlertAction());
            }, 2000);
        }, 200);
    } catch (error) { }
};
/**
 * Changes the layout type
 * @param {*} param0
 */
export const warningAlert = (alert: any) => async (dispatch: any) => {
    try {
        dispatch(dismissAlertAction()); // Set state to false
        setTimeout(() => {
            dispatch(warningAlertAction(alert));
            setTimeout(() => {
                dispatch(dismissAlertAction());
            }, 2000);
        }, 200);
    } catch (error) { }
};
/**
 * Changes the layout type
 * @param {*} param0
 */
export const dismissAlert = () => async (dispatch: any) => {
    try {
        dispatch(dismissAlertAction());
    } catch (error) { }
};