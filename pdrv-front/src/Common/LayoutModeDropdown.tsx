import React from "react";
import {changeLayoutMode} from 'slices/thunk';
import {useDispatch, useSelector} from 'react-redux';
import {LAYOUT_MODE_TYPES} from 'Common/constants/layout';


const LayoutModeDropdown = () => {
    const dispatch = useDispatch<any>();
    const {topbarThemeType} = useSelector((state: any) => ({
        topbarThemeType: state.Layout.topbarThemeType
    }));
    const changeMode = (mode: any) => {
        if (mode === 'light') {
            dispatch(changeLayoutMode(LAYOUT_MODE_TYPES.DARKMODE));
        } else {
            dispatch(changeLayoutMode(LAYOUT_MODE_TYPES.LIGHTMODE));
        }
    }
    return (
        <React.Fragment>
            <i onClick={() => {
                changeMode(topbarThemeType)
            }}
               className={`mx-2 ms-2 cursor-pointer bi bi-${topbarThemeType === 'light' ? 'moon' : 'sun'} align-middle fs-20`}></i>
        </React.Fragment>
    )
}

export default LayoutModeDropdown;