import { USER_ROLE } from "Common/constants";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
const Navdata = () => {
    const {t} = useTranslation();

    //state data
    const [isStock, setIsStock] = useState(false);
    const [isCategory, setIsCategory] = useState(false);
    const [isUser, setIsUser] = useState(false);
    const [iscurrentState, setIscurrentState] = useState('Dashboard');

    const {userRole} = useSelector((state: any) => ({
        userRole: state.Login.userRole,
    }));

    useEffect(() => {
        console.log("userRole", userRole);
    }, [userRole]);

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute("subitems")) {
            const ul: any = document.getElementById("two-column-menu");
            const iconItems: any = ul.querySelectorAll(".nav-icon.active");
            let activeIconItems = [...iconItems];
            activeIconItems.forEach((item) => {
                item.classList.remove("active");
            });
        }
    }

    useEffect(() => {
        document.body.classList.remove('twocolumn-panel');
        if (iscurrentState !== 'IsStock') {
            setIsStock(false);
        }
        if (iscurrentState !== 'IsCategory') {
            setIsCategory(false);
        }
        if (iscurrentState !== 'IsUser') {
            setIsUser(false);
        }
    }, [
        iscurrentState,
        isCategory,
        isStock,
        isUser
    ]);

    const menuItemsAdmin = [
        {label: t("menu"), isHeader: true},
        {id: "dashboard", label: t("dashboard"), icon: "bi bi-people-fill", link: "/dashboard"},
        {id: "users", label: t("clients"), icon: "bi bi-people-fill", link: "/user-management/clients"},
        {
            id: "Rendez-Vous",
            label: t("rendez-vous"),
            icon: "bi bi-calendar-event-fill",
            link: "/AdminCalendar"
        },
        { id: "workflow", label: t("workflow"), icon: "ri-git-branch-line align-bottom me-2 text-muted", link: "/workflow" },
    ];
    const menuItemsSupAdmin = [
        {label: t("menu"), isHeader: true},
        {id: "dashboard", label: t("dashboard"), icon: "bi bi-people-fill", link: "/dashboard"},
        {id: "users", label: t("admins"), icon: "bi bi-people-fill", link: "/admins"},
    ];

    let menuItems: any[] = [];
    switch ((userRole || "").toLowerCase()) {
        case USER_ROLE.ADMIN:
            menuItems = menuItemsAdmin;
            break;
        case USER_ROLE.SUPADMIN:
            menuItems = menuItemsSupAdmin;
            break;
        default:
            menuItems = [];
    }

    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;