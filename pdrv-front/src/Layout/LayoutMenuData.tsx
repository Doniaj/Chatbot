import React, {useEffect, useState} from "react";

const Navdata = () => {
    //state data
    const [isStock, setIsStock] = useState(false);
    const [isCategory, setIsCategory] = useState(false);
    const [isUser, setIsUser] = useState(false);
    const [iscurrentState, setIscurrentState] = useState('Dashboard');

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

    const menuItems: any = [
        {
            label: "menu",
            isHeader: true,
        },
        {
            id: "products",
            label: "products",
            icon: "bi bi-box-seam",
            link: "/product/list",
            click: function (e: any) {
                e.preventDefault();
                updateIconSidebar(e);
            }
        },
        {
            id: "Stock",
            label: "stock",
            icon: "bi bi-box-seam",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsStock(!isStock);
                setIscurrentState('IsStock');
                updateIconSidebar(e);
            },
            stateVariables: isStock,
            subItems: [
                {
                    id: "list",
                    label: "list",
                    link: "/stock/list",
                    parentId: "Stock",
                },
                {
                    id: "enter-stock",
                    label: "enter-stock",
                    link: "/stock/addStock",
                    parentId: "Stock",
                },
            ],
        }
    ];
    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;
