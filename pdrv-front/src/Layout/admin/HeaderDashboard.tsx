import React, {useEffect} from 'react';
import FullScreenDropdown from '../../Common/FullScreenDropdown';
import ProfileDropdown from '../../Common/ProfileDropdown';
import LayoutModeDropdown from 'Common/LayoutModeDropdown';
import {Link} from 'react-router-dom';
import { Container, Dropdown, Button, Row, Col, Card, Image, Navbar, Nav } from "react-bootstrap";

//import images
import logo from "assets/images/logoPRDV.png"
import logodark from "../../assets/images/logo-dark.png";
import logolight from "../../assets/images/logo-light.png";
import {useStore} from "react-redux";
import {apiImageUrl} from "../../configs/site.config";

const toogleMenuBtn = () => {

    var windowSize = document.documentElement.clientWidth;

    if (windowSize > 767)
        document.querySelector(".hamburger-icon")?.classList.toggle('open');

    //For collapse horizontal menu
    if (document.documentElement.getAttribute('data-layout') === "horizontal") {
        document.body.classList.contains("menu") ? document.body.classList.remove("menu") : document.body.classList.add("menu");
    }

    //For collapse vertical menu
    if (document.documentElement.getAttribute('data-layout') === "vertical") {
        if (windowSize < 1025 && windowSize > 767) {
            document.body.classList.remove('vertical-sidebar-enable');
            (document.documentElement.getAttribute('data-sidebar-size') === 'sm') ? document.documentElement.setAttribute('data-sidebar-size', '') : document.documentElement.setAttribute('data-sidebar-size', 'sm');
        } else if (windowSize > 1025) {
            document.body.classList.remove('vertical-sidebar-enable');
            (document.documentElement.getAttribute('data-sidebar-size') === 'lg') ? document.documentElement.setAttribute('data-sidebar-size', 'sm') : document.documentElement.setAttribute('data-sidebar-size', 'lg');
        } else if (windowSize <= 767) {
            document.body.classList.add('vertical-sidebar-enable');
            document.documentElement.setAttribute('data-sidebar-size', 'lg');
        }
    }

    //Two column menu
    if (document.documentElement.getAttribute('data-layout') === "twocolumn") {
        document.body.classList.contains('twocolumn-panel') ? document.body.classList.remove('twocolumn-panel') : document.body.classList.add('twocolumn-panel');
    }

};

const HeaderDashboard = (props: any) => {
    let Props = props.props;
    const store = useStore<any>();

    useEffect(() => {
        const user: any = store.getState()?.auth?.user || {}
        let link = document.querySelector("link[rel~='icon']") as HTMLAnchorElement | null;
        if (link && link.href) {
            link.href = user?.logo_id ? apiImageUrl + user?.logo_id : logo;
        }
    })
    return (
        <React.Fragment>
            <Navbar className="navbar-expand-lg is-sticky" id="navbar">
                <Container >
                    <Navbar.Brand href="/" className="d-none d-lg-block">
                        <div className="logo-dark">
                            <Image src={logo} alt="" height="25" />
                        </div>
                        <div className="logo-light">
                            <Image src={logo} alt="" height="25" /> <span className="logo-txt"></span>
                        </div>
                    </Navbar.Brand>
                    <Button className="btn btn-soft-primary btn-icon d-lg-none collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <i className="bi bi-list fs-20"></i>
                    </Button>

                    <Navbar.Collapse id="navbarSupportedContent">
                        <Nav as="ul" className="mx-lg-auto mb-2 mb-lg-0" id="navigation-menu">
                            <li className="nav-item d-block d-lg-none">
                                <Link to="/" className="d-block p-3 h-auto text-center"> <Image src={logo} alt=""
                                                                                                height="25"/></Link>
                            </li>
                            <li className="nav-item dropdown dropdown-hover">
                                <Link className="nav-link dropdown-toggle" data-key="t-products" to="/#" role="button"
                                      data-bs-toggle="dropdown" aria-expanded="true">{Props.t('products')}</Link>
                                <ul className="dropdown-menu dropdown-mega-menu-xl dropdown-menu-center">
                                    <div className="ms-3 mt-2">Products</div>
                                    <hr/>
                                    <li className="nav-item-navbar">
                                        <Link to="/ai-voice-agent" className="nav-link" data-key="t-categories">
                                            <i className="bi bi-clock ms-3 mx-5"></i>
                                            <div>
                                                <span>{Props.t('ai-voice-agent')}</span>
                                                <div className="nav-description">
                                                    Create conversational human-like agents using realtime, low-latency
                                                    state-of-the-art voice AI.
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                    <li className="nav-item-navbar">
                                        <Link to="/ai-voice-agent" className="nav-link" data-key="t-categories">
                                            <i className="bi bi-clock ms-3 mx-5"></i>
                                            <div>
                                                <span>{Props.t('ultra-realistic-ai-voices')}</span>
                                                <div className="nav-description">
                                                    Next generation AI speech technology, our voices capture emotion
                                                    from text to generate speech that is truly human-like
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                    {/*<Dropdown className="nav-item dropdown-hover">*/}
                                    {/*    <Link to="/#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-key="t-users">{Props.t('users')}</Link>*/}
                                    {/*    <ul className="dropdown-menu submenu">*/}
                                    {/*        <li><Link className="nav-link" to='/account' data-key="t-my-account">{Props.t('my-account')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/auth-signin-basic' data-key="t-sign-in">{Props.t('sign-up')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/auth-signup-basic' data-key="t-sign-up">{Props.t('sign-in')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/auth-pass-reset-basic' data-key="t-passowrd-reset">{Props.t('passowrd-reset')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/auth-pass-change-basic' data-key="t-create-password">{Props.t('create-password')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/auth-success-msg-basic' data-key="t-success-message">{Props.t('success-message')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/auth-twostep-basic' data-key="t-two-step-verify">{Props.t('two-step-verify')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/auth-logout-basic' data-key="t-logout">{Props.t('logout')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/auth-404' data-key="t-error-404">{Props.t('error-404')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/auth-500' data-key="t-error-500">{Props.t('error-500')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/coming-soon' data-key="t-coming-soon">{Props.t('coming-soon')}</Link></li>*/}
                                    {/*    </ul>*/}
                                    {/*</Dropdown>*/}

                                    {/*<li className="nav-item">*/}
                                    {/*    <Link to='/about-us' className="nav-link" data-key="t-about">{Props.t('about')}</Link>*/}
                                    {/*</li>*/}
                                    {/*<li className="nav-item">*/}
                                    {/*    <Link to='/purchase-guide' className="nav-link" data-key="t-purchase-guide">{Props.t('purchase-guide')}</Link>*/}
                                    {/*</li>*/}
                                    {/*<li className="nav-item">*/}
                                    {/*    <Link to='/terms-conditions' className="nav-link" data-key="t-terms-of-service">{Props.t('terms-of-service')}</Link>*/}
                                    {/*</li>*/}
                                    {/*<li className="nav-item">*/}
                                    {/*    <Link to='/privacy-policy' className="nav-link" data-key="t-privacy-policy">{Props.t('privacy-policy')}</Link>*/}
                                    {/*</li>*/}
                                    {/*<li className="nav-item">*/}
                                    {/*    <Link to='/store-locator' className="nav-link" data-key="t-store-locator">{Props.t('store-locator')}</Link>*/}
                                    {/*</li>*/}
                                    {/*<li className="nav-item">*/}
                                    {/*    <Link to='/ecommerce-faq' className="nav-link" data-key="t-faq">{Props.t('faq')}</Link>*/}
                                    {/*</li>*/}
                                    {/*<li className="nav-item">*/}
                                    {/*    <Link to='/invoice' className="nav-link" data-key="t-invoice">{Props.t('invoice')}</Link>*/}
                                    {/*</li>*/}
                                    {/*<li className="nav-item dropdown dropdown-hover">*/}
                                    {/*    <Link to="/#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-key="t-email-template">{Props.t('email-template')}</Link>*/}
                                    {/*    <ul className="dropdown-menu submenu ">*/}
                                    {/*        <li><Link className="nav-link" to='/email-black-friday' data-key="t-black-friday">{Props.t('black-friday')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/email-flash-sale' data-key="t-flash-sale">{Props.t('flash-sale')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/email-order-success' data-key="t-order-success">{Props.t('order-success')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to='/email-order-success-2' data-key="t-order-success-2">{Props.t('order-success-2')}</Link></li>*/}
                                    {/*    </ul>*/}
                                    {/*</li>*/}
                                    {/*<li className="nav-item">*/}
                                    {/*    <Link to="../components/index" className="nav-link" target="_blank" data-key="t-components">Components</Link>*/}
                                    {/*</li>*/}
                                    {/*<Dropdown className="nav-item dropdown-hover">*/}
                                    {/*    <Link to="/#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-key="t-multi-level">{Props.t('multi-level')}</Link>*/}
                                    {/*    <ul className="dropdown-menu submenu">*/}
                                    {/*        <li><Link className="nav-link" to="/#" data-key="t-level-1.1">{Props.t('level-1.1')}</Link></li>*/}
                                    {/*        <li><Link className="nav-link" to="/#" data-key="t-level-1.2">{Props.t('level-1.2')}</Link></li>*/}
                                    {/*        <li className="dropdown dropdown-hover">*/}
                                    {/*            <Link to="/#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-key="t-level-1.3">{Props.t('level-1.3')}</Link>*/}
                                    {/*            <ul className="dropdown-menu submenu">*/}
                                    {/*                <li><Link className="nav-link" to="/#" data-key="t-level-2.1">{Props.t('level-2.1')}</Link></li>*/}
                                    {/*                <li><Link className="nav-link" to="/#" data-key="t-level-2.2">{Props.t('level-2.2')}</Link></li>*/}
                                    {/*                <li className="dropdown dropdown-hover">*/}
                                    {/*                    <Link to="/#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-key="t-level-2.3">{Props.t('level-2.3')}</Link>*/}
                                    {/*                    <ul className="dropdown-menu submenu">*/}
                                    {/*                        <li><Link className="nav-link" to="/#" data-key="t-level-3.1">{Props.t('level-3.1')}</Link></li>*/}
                                    {/*                        <li><Link className="nav-link" to="/#" data-key="t-level-3.2">{Props.t('level-3.2')}</Link></li>*/}
                                    {/*                    </ul>*/}
                                    {/*                </li>*/}
                                    {/*            </ul>*/}
                                    {/*        </li>*/}
                                    {/*    </ul>*/}
                                    {/*</Dropdown>*/}
                                </ul>
                            </li>

                            <li className="nav-item">
                                <Link to="/api" className="nav-link" data-key="t-api">{Props.t('api')}</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/pricing" className="nav-link" data-key="t-pricing">{Props.t('pricing')}</Link>
                            </li>
                        </Nav>
                    </Navbar.Collapse>

                    <div className="bg-overlay navbar-overlay" data-bs-toggle="collapse"
                         data-bs-target="#navbarSupportedContent.show"></div>
                    <div className="d-flex align-items-center">
                        <Button type="button"
                                className="btn  btn-topbar btn-ghost-dark text-muted">
                            Try for free
                        </Button>
                        <div className="dropdown header-item dropdown-hover-end">
                            <Dropdown>
                                <Dropdown.Toggle id="page-header-user-dropdown" bsPrefix="btn" className="btn btn-icon btn-topbar btn-link rounded-circle" as="a">
                                    <Image className="rounded-circle header-profile-user" src={logo} alt="Header Avatar" />
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    <Dropdown.Item href='/shop/orderhistory'><i className="bi bi-cart4 text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Order History</span></Dropdown.Item>
                                    <Dropdown.Item href='/shop/order'><i className="bi bi-truck text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Track Orders</span></Dropdown.Item>
                                    <Dropdown.Item href="#/action-3"><i className="bi bi-speedometer2 text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Dashboard</span></Dropdown.Item>
                                    <Dropdown.Item href='/ecommerce-faq'><i className="mdi mdi-lifebuoy text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Help</span></Dropdown.Item>
                                    <Dropdown.Item href='/account'><i className="bi bi-coin text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Balance : <b>$8451.36</b></span></Dropdown.Item>
                                    <Dropdown.Item href='/account'><span className="badge bg-success-subtle text-success mt-1 float-end">New</span><i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Settings</span></Dropdown.Item>
                                    <Dropdown.Item href='/auth-logout-basic'><i className="bi bi-box-arrow-right text-muted fs-16 align-middle me-1"></i> <span className="align-middle" data-key="t-logout">Logout</span></Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>
                </Container>
            </Navbar>
        </React.Fragment>
    );
}

export default HeaderDashboard;
