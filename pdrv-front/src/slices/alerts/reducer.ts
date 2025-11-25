import {createSlice} from "@reduxjs/toolkit";
import {ALERT_TYPES} from "Common/constants/layout";

export interface AlertState {
  type : ALERT_TYPES.DANGER | ALERT_TYPES.SUCCESS | ALERT_TYPES.WARNING | ALERT_TYPES.PRIMARY;
  state : boolean;
  message : string;
}

export const initialState: AlertState = {
  type : ALERT_TYPES.SUCCESS,
  state : false,
  message : "",
};

const AlertSlice = createSlice({
  name: 'AlertSlice',
  initialState,
  reducers: {
    changeAlertAction(state: any, action: any) {
      state.type = action.payload.type;
      state.state = action.payload.state;
      state.message = action.payload.message;
    },
    dangerAlertAction(state: any, action: any) {
      state.type = ALERT_TYPES.DANGER;
      state.state = true;
      state.message = action.payload;
    },
    successAlertAction(state: any, action: any) {
      state.type = ALERT_TYPES.SUCCESS;
      state.state = true;
      state.message = action.payload;
    },
    primaryAlertAction(state: any, action: any) {
      state.type = ALERT_TYPES.PRIMARY;
      state.state = true;
      state.message = action.payload;
    },
    warningAlertAction(state: any, action: any) {
      state.type = ALERT_TYPES.WARNING;
      state.state = true;
      state.message = action.payload;
    },
    dismissAlertAction(state: any) {
      state.state = false;
    },
  }
});

export const {
  changeAlertAction,
  dangerAlertAction,
  successAlertAction,
  warningAlertAction,
  dismissAlertAction,
  primaryAlertAction

} = AlertSlice.actions;

export default AlertSlice.reducer;