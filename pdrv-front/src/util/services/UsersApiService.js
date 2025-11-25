import BaseApiService from "./BaseApiService";
import axios from "axios";
import {apiUrl} from "../../configs/site.config";

class UsersApiService extends BaseApiService {
  constructor() {
    super('user');
  }

  SignIn(credentials) {
    return axios.create().post(apiUrl + "/user/login", credentials);
  }

  Register(credentials) {
    return axios.create().post(apiUrl + "/user/register", credentials);
  }

  addUser(credentials) {
    return this.setHeaderToken().post(apiUrl + "/user/addUser", credentials);
  }

  updateUser(credentials) {
    return this.setHeaderToken().post(apiUrl + "/user/updateUser", credentials);
  }

  verifyTokenParams(data){
    return axios.create().post(apiUrl + '/user/verifyTokenParams',data);
  }

  changePassword(data){
    return this.setHeaderToken().post(apiUrl + "/user/changePassword", data)
  }

  getAllUsers(data){
    return this.setHeaderToken().post(apiUrl + "/user/getAllUsers", data)
  }

  forgotPassword(data) {
    return axios.create().post(apiUrl + "/user/forgotPassword", data);
  }

  VerifyResetToken(data){
    return axios.create().post(apiUrl + "/user/verifyResetToken", data)
  }

  resetPassword(data){
    return axios.create().post(apiUrl + "/user/resetPassword", data)
  }

  getCurrentUser(){
    return this.setHeaderToken().get(apiUrl + "/user/getCurrentUser")
  }

  update(data){
    return this.setHeaderToken().put(apiUrl + "/user/update", data);
  }

  addWeekWorkingHours(data) {
    return this.setHeaderToken().post(apiUrl + "/user/addWeekWorkingHours", data);
  }

  addAppointmentDuration(data) {
    return this.setHeaderToken().post(apiUrl + "/user/addAppointmentDuration", data);
  }

  getAppointmentDurationByUserId(userId) {
    return this.setHeaderToken().post(apiUrl + "/user/find", { type: 'appointmentDuration', userId });
  }

  getWorkingHoursByUserId(userId) {
    return this.setHeaderToken().post(apiUrl + "/user/find", { type: 'workingHours', userId });
  }
}

const usersApiService = new UsersApiService();

export default usersApiService;