import Dashboard from "Components/Admin/Dashboard";
import Login from "Components/Public/Auth/Login"
import Users from "../Components/Admin/UsersList";
import AdminCalendar from "../Components/Admin/Disponibilité/AdminCalendar";
import DashboardAdmin from "Components/Admin/Dashboard";
import DashboardSupAdmin from "Components/SupAdmin/Dashboard";
import UsersAdmins from "../Components/SupAdmin/UsersList/index";
import AddAdmin from "../Components/SupAdmin/UsersList/AddUser";
import {Navigate} from "react-router-dom";
import MyAccount from "../Components/Shared/User/MyAccount";
import Passwordcreate from "../Components/Public/Auth/Passwordcreate";
import Passwordreset from "../Components/Public/Auth/Passwordreset";
import AddUser from "../Components/Admin/UsersList/AddUser";
import Appointments from "../Components/Admin/UsersList/AppointmentsPage";
import Register from "../Components/Public/Auth/Register";
import VerifyAccount from "../Components/Public/Auth/VerifyAccount";
import WorkFlow from "../Components/Shared/workFlow/workFlow";
import ClientDetails from "../Components/Admin/UsersList/ClientDetails";
import { USER_ROLE } from "Common/constants";

const sharedProtectedRoutes = [
    {path: "/user-settings", component: <MyAccount/>}
];
const supAdminProtectedRoutes = [
    {path: "/dashboard", component: <DashboardSupAdmin/>},
    {
        path: "/",
        exact: true,
        component: <Navigate to="/dashboard"/>
    },
    {path: "/workflow", component: <WorkFlow role={USER_ROLE.SUPADMIN}/>},
    {path: "admins", component: <UsersAdmins/>},
    {path: "/admins/add", component: <AddAdmin/>},
    {path: "/admins/edit", component: <AddAdmin/>},
    {path: "*", component: <Navigate to="/dashboard"/>}
]

const adminProtectedRoutes = [
    {path: "/workflow", component: <WorkFlow role={USER_ROLE.ADMIN}/>},
    {path: "/user-management/clients", component: <Users/>},
    {path: "/user-management/addClient", component: <AddUser/>},
    {path: "/user-management/editClient", component: <AddUser/>},
    {path: "/user-management/appointments", component: <Appointments/>},
    {path: "/user-management/clientDetails", component: <ClientDetails/>},
    {path: "/AdminCalendar", component: <AdminCalendar/>},
    {path: "/dashboard", component: <DashboardAdmin/>},
    {
        path: "/",
        exact: true,
        component: <Navigate to="/dashboard"/>
    },
    {path: "*", component: <Navigate to="/dashboard"/>}
]
const publicRoutes = [
    {path: "/verifyAccount", component: <VerifyAccount/>},
    {path: "/login", component: <Login/>},
    {path: "/forgetPassword", component: <Passwordreset/>},
    {path: "/resetPassword", component: <Passwordcreate/>}
];

export {sharedProtectedRoutes, publicRoutes, adminProtectedRoutes,supAdminProtectedRoutes};