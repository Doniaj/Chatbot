import React, {useEffect, useState} from "react";
import SimpleBar from "simplebar-react";
//import logo
import logo from "assets/images/marketplace-logo.png";

//Import Components
import VerticalLayout from "./VerticalLayouts/index";
import TwoColumnLayout from "./TwoColumnLayout";
import { Button, Container } from "react-bootstrap";
import HorizontalLayout from "./HorizontalLayout";
import {apiImageUrl} from "../configs/site.config";
import {GetUserInfo, setCryptedLocalStorage} from "../helpers/stringHelper";
import EfilesApiService from "../util/services/EfilesApiService";
import {NotifyError} from "../util/alerte_extensions/AlertsComponents";
import {loginSuccess} from "../slices/auth/login/reducer";
import {Dispatch} from "redux";
import {useDispatch} from "react-redux";
import {NotifySuccess} from "../Common/Toast";
const Sidebar = ({ layoutType }: any) => {
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(GetUserInfo())
  const dispatch: Dispatch<any> = useDispatch()

  useEffect(() => {
    var verticalOverlay = document.getElementsByClassName("vertical-overlay");
    if (verticalOverlay) {
      verticalOverlay[0].addEventListener("click", function () {
        document.body.classList.remove("vertical-sidebar-enable");
      });
    }
  });

  const addEventListenerOnSmHoverMenu = () => {
    // add listener Sidebar Hover icon on change layout from setting
    if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover-active');
    } else if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover-active') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    } else {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    }
  };
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0] as File || null;
      const supportedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
      const formData = new FormData();
      formData.append("file", file, file.name);
      setUploadedFile(formData)
      if (!supportedFormats.includes(file?.type)) {
        setSelectedImage(null)
        NotifyError("LOGO NOT SUPPORTED !")
      } else {
        setSelectedImage(URL.createObjectURL(file))
        uploadImage(formData)
      }

    }
  };
  const uploadIMG = (uploadedFileX : any) => {
    EfilesApiService.upload(uploadedFileX).then((result:any)=>{
      let efile_id = result?.data?.data;
      // accountsApiService.update({
      //   account_id : currentUser?.account_id,
      //   logo_id : efile_id
      // }).then(() => {
      //   const new_user = {...currentUser, ...{logo_id : efile_id}};
      //   setCurrentUser(new_user)
      //   dispatch(loginSuccess({user: new_user}))
      //   setCryptedLocalStorage('currentuser', new_user)
      //   setUploadedFile(null)
      //   setSelectedImage(null)
      //   NotifySuccess("LOGO UPDATED !")
      // }).catch((err: any) => {
      //   NotifyError("Error , Please try again !")
      // })
    }).catch((err: any) => {
      NotifyError("Error , Please try again !")
    })
  }
  const uploadImage = (uploadedFileX : any) => {
    if(currentUser.logo_id){
      EfilesApiService.deleteFile(currentUser.logo_id).then(()=>{
        uploadIMG(uploadedFileX)
      })
  }else{
      uploadIMG(uploadedFileX)
    }
  }
  return (
    <React.Fragment>
      <div className="app-menu navbar-menu">
        <div className="navbar-brand-box">
          {/*<Link to="/" className="logo logo-dark">*/}
          {/*  <span className="logo-sm">*/}
          {/*    <img src={logoSm} alt="" height="26" />*/}
          {/*  </span>*/}
          {/*  <span className="logo-lg">*/}
          {/*    <img src={logoDark} alt="" height="26" />*/}
          {/*  </span>*/}
          {/*</Link>*/}

          {/*<Link to="/" className="logo logo-light">*/}
          {/*  <span className="logo-sm">*/}
          {/*    <img src={logoSm} alt="" height="24" />*/}
          {/*  </span>*/}
          {/*  <span className="logo-lg">*/}
          {/*    <img src={logoLight} alt="" height="24" />*/}
          {/*  </span>*/}
          {/*</Link>*/}
          <div className="position-relative d-inline-block ">
            <div
                className="position-absolute top-100 start-100 translate-middle ">
              <label htmlFor="category-image-input"
                     className="mb-0" data-bs-toggle="tooltip"
                     data-bs-placement="right"
                     title="Select Image">
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


            </div>
            <div>
              <div className="avatar-title bg-transparent rounded-3">
                <img src={!selectedImage ? currentUser?.logo_id ? apiImageUrl + currentUser?.logo_id : logo : selectedImage} alt="logo"
                     id="category-img"
                     className="rounded-3 object-fit-cover " style={{maxWidth : '150px'}}/>
              </div>
            </div>

          </div>
          <Button
            variant="link"
            size="sm"
            onClick={addEventListenerOnSmHoverMenu}
            type="button"
            className="p-0 fs-20 header-item float-end btn-vertical-sm-hover"
            id="vertical-hover"
          >
            <i className="ri-record-circle-line"></i>
          </Button>
        </div>
        {layoutType === "horizontal" ? (
          <div id="scrollbar">
            <Container fluid>
              <div id="two-column-menu"></div>
              <ul className="navbar-nav" id="navbar-nav">
                <HorizontalLayout />
              </ul>
            </Container>
          </div>
        ) : layoutType === 'twocolumn' ? (
          <React.Fragment>
            <TwoColumnLayout layoutType={layoutType} />
            <div className="sidebar-background"></div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <SimpleBar id="scrollbar" className="h-100">
              <Container fluid>
                <div id="two-column-menu"></div>
                <ul className="navbar-nav" id="navbar-nav">
                  <VerticalLayout layoutType={layoutType} />
                </ul>
              </Container>
            </SimpleBar>
            <div className="sidebar-background"></div>
          </React.Fragment>
        )}
      </div>
      <div className="vertical-overlay"></div>
    </React.Fragment>
  );
};

export default Sidebar;
