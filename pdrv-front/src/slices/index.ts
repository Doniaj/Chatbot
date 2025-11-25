import {combineReducers} from "redux";

import LayoutReducer from "./layouts/reducer";
import LoginReducer from "./auth/login/reducer";
import AlertReducer from "./alerts/reducer";


const rootReducer = combineReducers({
    Layout: LayoutReducer,
    Login: LoginReducer,
    Alert: AlertReducer
});

export default rootReducer;