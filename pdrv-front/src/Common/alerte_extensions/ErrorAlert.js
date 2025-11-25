import { Fragment } from 'react'
import {X} from 'react-feather'
import Avatar from "react-avatar";

const ErrorAlert = ({props}) => (

  <Fragment>
    <div className='toastify-header'>
      <div className='title-wrapper'>
        <Avatar size='sm' color='danger' icon={<X size={12} />} />
        <h6 className='toast-title'>Error!</h6>
      </div>
    </div>
    <div className='toastify-body'>
      <span role='img' aria-label='toast-text'>
      ❌ {props}
      </span>
    </div>
  </Fragment>
)
export default ErrorAlert

