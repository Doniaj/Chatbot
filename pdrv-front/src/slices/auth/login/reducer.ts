import { createSlice } from "@reduxjs/toolkit";
import {GetUserInfo} from "../../../helpers/stringHelper";
import {
  USER_ROLE
} from "Common/constants/index";
export const initialState = {
  user: GetUserInfo(),
  error: "",
  loading: false,
  isUserLogout: false,
  userRole : (GetUserInfo()?.role || "").toLowerCase()
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    changeUserRoleAction(state: any, action: any) {
      state.userRole = action.payload;
    },
    apiError(state, action) {
      state.error = action.payload;
      state.loading = false;
      state.isUserLogout = false;
    },
    loginSuccess(state, action) {
      state.user = action.payload.user
      state.loading = false;
    },
    logoutUserSuccess(state, action) {
      state.isUserLogout = true
    },
    reset_login_flag(state) {
      state.error = ""
    }
  },
});

export const {
  apiError,
  loginSuccess,
  logoutUserSuccess,
  reset_login_flag,
  changeUserRoleAction
} = loginSlice.actions

export default loginSlice.reducer;
