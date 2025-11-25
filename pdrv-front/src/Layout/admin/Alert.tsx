import React from "react";
import "./Alert.css";
import {useDispatch, useSelector} from "react-redux";
import {dismissAlert} from "../../slices/alerts/thunk";

const AlertWithLoader = () => {

    const dispatch = useDispatch<any>();
    const {state, message, type} = useSelector((state: any) => ({
        state: state.Alert.state,
        message: state.Alert.message,
        type: state.Alert.type,
    }));
    return (
        <>
            {state && (
                <div className={`alert-box ${type}`}>
                    <span className="text-center fw-bold">{message}</span>
                    <button className="dismiss-btn" onClick={() => dispatch(dismissAlert())}>✖</button>
                </div>
            )}
        </>
    );
};

export default AlertWithLoader;
