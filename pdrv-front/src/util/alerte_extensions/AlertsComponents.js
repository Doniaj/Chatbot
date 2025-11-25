
import { toast } from 'react-toastify'
import ErrorAlert from "./ErrorAlert";
import SuccessAlert from "./SuccessAlert";
import 'react-toastify/dist/ReactToastify.css';

export const NotifySuccess = (message) => toast(<SuccessAlert props={message} />, { hideProgressBar: true })
export const NotifyError = (message) => toast(<ErrorAlert props={message} />, { hideProgressBar: true })
