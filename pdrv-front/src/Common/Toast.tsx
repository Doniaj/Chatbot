import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SuccessAlert from "./alerte_extensions/SuccessAlert";
import ErrorAlert from "./alerte_extensions/ErrorAlert";
import InfoToast from "./alerte_extensions/InfosToastr";

export const NotifySuccess = (message:any) => toast(<SuccessAlert props={message} />, { hideProgressBar: true })
export const NotifyError = (message:any) => toast(<ErrorAlert props={message} />, { hideProgressBar: true })
export const NotifyInfo = (message:any) => toast(<InfoToast props={message} />, { hideProgressBar: true })
