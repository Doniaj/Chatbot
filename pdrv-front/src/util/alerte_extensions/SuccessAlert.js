import {Fragment} from 'react'

const SuccessAlert = ({props}) => (
    <Fragment>
        <div className='toastify-header'>
            <div className='title-wrapper'>
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
