import { Fragment } from 'react'
import { Info } from 'react-feather'

const InfoToast = ({props}) => (
    <Fragment>
        <div className='toastify-header'>
            <div className='title-wrapper'>
                <Avatar size='sm' color='info' icon={<Info size={12} />} />
                <h6 className='toast-title'>Info!</h6>
            </div>
        </div>
        <div className='toastify-body'>
      <span role='img' aria-label='toast-text'>
        👋 {props}
      </span>
        </div>
    </Fragment>
)

export default InfoToast
