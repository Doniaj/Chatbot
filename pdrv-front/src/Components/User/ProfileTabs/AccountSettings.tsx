import {Button, Card, Col, Form, Row, Spinner} from "react-bootstrap";
import avatar from "../../../assets/images/users/user-dummy-img.jpg";
import PhoneInput from "react-phone-input-2";
import React, {useEffect, useState} from "react";
import {useFormik} from "formik";
import * as Yup from "yup";
import {useDispatch, useStore} from "react-redux";
import {apiImageUrl} from "../../../configs/site.config";
import {Dispatch} from "redux";
import 'react-phone-input-2/lib/style.css'
import {GetUserInfo, setCryptedLocalStorage} from "../../../helpers/stringHelper";
import {loginSuccess} from "../../../slices/auth/login/reducer";
import EfilesApiService from "../../../util/services/EfilesApiService";
import usersApiService from "../../../util/services/UsersApiService";
import efilesApiService from "../../../util/services/EfilesApiService";
import {NotifyError, NotifySuccess} from "../../../Common/Toast";

const AccountSettings = ({setUserData, props}: any) => {
    let Props = props
    const store = useStore<any>();
    const user: any = store.getState().Login.user || {}
    const userInfo = user ? user : GetUserInfo()
    const dispatch: Dispatch<any> = useDispatch()

    const [blockUI, setBlockUI] = useState<boolean>(false)
    const [phoneNumber1, setPhoneNumber1] = useState<any>(userInfo?.phone_number1 || '+216')
    const [phoneNumber2, setPhoneNumber2] = useState<any>(userInfo?.phone_number2 || '+216')
    const [uploadedFile, setUploadedFile] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [errorImage, setErrorImage] = useState<string>("");
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            first_name: "",
            last_name: "",
        },
        validationSchema: Yup.object({
            first_name: Yup.string().required(Props.t('add-first-name')),
            last_name: Yup.string().required(Props.t('add-last-name')),
        }),
        onSubmit: (values, {setErrors}) => {
            setBlockUI(true)
            deleteImage(userInfo?.profile_image_id).then(() => {
                efilesApiService.upload(uploadedFile).then((res: any) => {
                    let efile_id = res?.data?.data;
                    let user = {
                        user_id: userInfo?.user_id,
                        first_name: values.first_name,
                        last_name: values.last_name,
                        phone_number1: !(phoneNumber1 || '').startsWith('+') ? phoneNumber1 : null ,
                        phone_number2: !(phoneNumber2 || '').startsWith('+') ? phoneNumber2 : null ,
                        username: values.first_name + ' ' + values.last_name,
                        profile_image_id: efile_id
                    }

                    let updatedData = {
                        phone_number1: !(phoneNumber1 || '').startsWith('+') ? phoneNumber1 : null ,
                        phone_number2: !(phoneNumber2 || '').startsWith('+') ? phoneNumber2 : null ,
                        first_name: values.first_name,
                        last_name: values.last_name,
                        username: values.first_name + ' ' + values.last_name,
                        fullname: values.first_name + ' ' + values.last_name,
                        profile_image_id: efile_id
                    }
                    usersApiService.update(user).then(() => {
                        NotifySuccess(Props.t('user-updated'))
                        setBlockUI(false)
                        const new_user = {...userInfo, ...updatedData};
                        setUserData(new_user)
                        dispatch(loginSuccess({user: new_user}))
                        setCryptedLocalStorage('currentuser', new_user)
                    }).catch(() => {
                        setBlockUI(false)
                        NotifyError(Props.t('fail-catch'))
                    })
                }).catch(() => {
                    setBlockUI(false)
                    NotifyError(Props.t('cannot-upload-image'))
                })
            })
        },
    });
    const deleteImage = (image_id: number | null) => {
        return new Promise((resolve, reject) => {
            if (image_id) {
                EfilesApiService.deleteFile(image_id).then(() => {
                    resolve(true)
                }).catch((err: any) => {
                    reject(err)
                })
            } else {
                resolve(true)
            }
        })
    }
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setErrorImage("")
            const file = event.target.files[0] as File || null;
            const supportedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
            const formData = new FormData();
            formData.append("file", file, file.name);
            setUploadedFile(formData)
            if (!supportedFormats.includes(file?.type)) {
                setErrorImage(Props.t('allowed-formats-images'))
                setSelectedImage(null)
            } else {
                setSelectedImage(URL.createObjectURL(file))
            }

        }
    };

    const getImage = (image_id: number | null, title: string) => {
        if (image_id) {
            fetch(apiImageUrl + image_id).then(response => response.blob())
                .then(blob => {
                    const file = new File([blob], title, {type: blob.type});
                    setSelectedImage(URL.createObjectURL(file))
                    const formData = new FormData();
                    formData.append("file", file, title);
                    setUploadedFile(formData)


                }).catch(() => {
                NotifyError(Props.t('fail-catch'))
            })
        }
    }
    useEffect(() => {
        if (userInfo) {
            getImage(userInfo?.profile_image_id, userInfo?.username)
            formik.setValues({
                first_name: userInfo?.first_name,
                last_name: userInfo?.last_name,
            })
        }
    }, [])
    return (
        <div className="tab-pane fade show" id="custom-v-pills-setting" role="tabpanel">
            <Row>
                <Col lg={12}>
                    <Card>
                        <Card.Body>
                            <Form action="" onSubmit={formik.handleSubmit}>
                                <Row>
                                    <Col lg={12}>
                                        <h5 className="fs-16 text-decoration-underline mb-4">{Props.t('personal-details')}</h5>
                                    </Col>
                                    <Col lg={12}>
                                        <div className="text-center">
                                            <div className="position-relative d-inline-block">
                                                {!blockUI && (<div
                                                    className="position-absolute bottom-0 end-0">
                                                    <label htmlFor="category-image-input"
                                                           className="mb-0" data-bs-toggle="tooltip"
                                                           data-bs-placement="right"
                                                           title={Props.t('select-image')}>
                                                                <span className="avatar-xs d-inline-block">
                                                                    <span
                                                                        className="avatar-title bg-light border rounded-circle text-muted cursor-pointer">
                                                                        <i className="ri-image-fill"></i>
                                                                    </span>
                                                                </span>
                                                    </label>
                                                    <input onChange={(e) => {
                                                        handleImageChange(e)
                                                    }}
                                                           className="form-control d-none"
                                                           id="category-image-input" type="file" name="image"
                                                           accept="image/png, image/jpg, image/jpeg"
                                                    />

                                                </div>)}

                                                <div className="avatar-lg p-1">
                                                    <div className="avatar-title bg-light rounded-circle">
                                                        <img src={!selectedImage ? avatar : selectedImage}
                                                             alt={uploadedFile?.name} id="users-img-field"
                                                             className="avatar-md rounded-circle object-cover"/>
                                                    </div>
                                                </div>
                                                {errorImage !== "" ? <div
                                                    className="errorInvalidMessages">{errorImage}</div> : null}
                                            </div>
                                        </div>
                                    </Col>
                                    <Col lg={6} className="mt-4">
                                        <div className="mb-3">
                                            <Form.Label htmlFor="firstnameInput">{Props.t('first-name')}</Form.Label>
                                            <Form.Control type="text"
                                                          id="firstnameInput"
                                                          placeholder="Enter your firstname"
                                                          name="first_name"
                                                          onChange={formik.handleChange}
                                                          value={formik.values.first_name}
                                                          defaultValue={userInfo?.first_name}
                                                          onBlur={formik.handleBlur}
                                                          disabled={blockUI}
                                            />
                                            {formik.errors.first_name && formik.touched.first_name ? (
                                                <span
                                                    className="text-danger">{formik.errors.first_name}</span>
                                            ) : null}
                                        </div>
                                    </Col>
                                    <Col lg={6} className="mt-4">
                                        <div className="mb-3">
                                            <Form.Label htmlFor="lastnameInput">{Props.t('last-name')}</Form.Label>
                                            <Form.Control type="text"
                                                          id="lastnameInput"
                                                          placeholder="Enter your lastname"
                                                          name="last_name"
                                                          onChange={formik.handleChange}
                                                          value={formik.values.last_name}
                                                          defaultValue={userInfo?.last_name}
                                                          onBlur={formik.handleBlur}
                                                          disabled={blockUI}
                                            />
                                            {formik.errors.last_name && formik.touched.last_name ? (
                                                <span
                                                    className="text-danger">{formik.errors.last_name}</span>
                                            ) : null}
                                        </div>
                                    </Col>
                                    <Col lg={6}>
                                        <div className="mb-3">
                                            <Form.Label htmlFor="phonenumberInput">{Props.t('phone-number-one')}</Form.Label>
                                            <PhoneInput
                                                country={216}
                                                inputStyle={{
                                                    width: "100%",
                                                    height: "100%"
                                                }}
                                                value={phoneNumber1}
                                                onChange={(value) => {
                                                    setPhoneNumber1(value)
                                                }} disabled={blockUI}/>
                                        </div>
                                    </Col>
                                    <Col lg={6}>
                                        <div className="mb-3">
                                            <Form.Label htmlFor="phonenumberInput">{Props.t('phone-number-two')}</Form.Label>
                                            <PhoneInput
                                                country={216}
                                                inputStyle={{
                                                    width: "100%",
                                                    height: "100%"
                                                }}
                                                value={phoneNumber2}
                                                onChange={(value) => {
                                                    setPhoneNumber2(value)
                                                }} disabled={blockUI}/>
                                        </div>
                                    </Col>
                                    <Col lg={6}>
                                        <div className="mb-3">
                                            <Form.Label htmlFor="emailInput">{Props.t('email')}</Form.Label>
                                            <Form.Control type="email" id="emailInput" value={userInfo?.email}
                                                          disabled={true}/>
                                        </div>
                                    </Col>
                                </Row>
                                <div className="text-sm-end">
                                    <Button type="submit" className="btn btn-secondary d-block d-sm-inline-block"
                                            disabled={blockUI}>{blockUI ?
                                        <Spinner size="sm" animation="border" className="me-2"/> :
                                        <i className="ri-edit-box-line align-middle me-2"></i>} {blockUI ? Props.t('updating...') : Props.t('update')}</Button>
                                </div>
                            </Form>

                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
export default AccountSettings;
