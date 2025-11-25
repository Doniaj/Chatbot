import {Fragment} from 'react'


const ErrorAlert = ({props}) => (
    <Fragment>
        <div className='toastify-header'>
            <div className='title-wrapper'>
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

