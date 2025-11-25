import { Fragment } from 'react'
import { Check } from 'react-feather'
import Avatar from "react-avatar";

const SuccessAlert = ({props}) => (
  <Fragment>
    <div className='toastify-header'>
      <div className='title-wrapper'>
        <Avatar size='sm' color='success' icon={<Check size={12} />} />
        <h6 className='toast-title'>Success!</h6>
      </div>
    </div>
    <div className='toastify-body'>
      <span role='img' aria-label='toast-text'>
      ✅ {props}
      </span>
    </div>
  </Fragment>
)

export default SuccessAlert
