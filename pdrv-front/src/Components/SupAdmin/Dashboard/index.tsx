import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Container, Table, Badge, Alert } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Users, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { withTranslation } from "react-i18next";
import usersApiService from '../../../util/services/UsersApiService';
import clientApiService from '../../../util/services/ClientsApiService';

interface User {
    user_id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email: string;
    role_id: number;
    active: string;
    is_verified: boolean;
    created_at: string;
    country?: string;
}

interface Client {
    id: number;
    admin_id: number;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    country?: string;
    active: string;
    created_at: string;
}

interface ChartData {
    month: string;
    year: number;
    monthNum: number;
    count: number;
}

interface RoleDistribution {
    name: string;
    value: number;
    color: string;
}

interface CountryDistribution {
    country: string;
    users: number;
    clients: number;
    total: number;
}

interface ClientsByAdmin {
    adminId: number;
    adminName: string;
    clientCount: number;
}

interface DashboardData {
    totalUsers: number;
    totalClients: number;
    totalAdmins: number;
    activeUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    recentUsers: User[];
    recentClients: Client[];
    userGrowthChart: ChartData[];
    clientGrowthChart: ChartData[];
    roleDistribution: RoleDistribution[];
    countryDistribution: CountryDistribution[];
    clientsByAdmin: ClientsByAdmin[];
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    subtitle?: string;
    percentage?: number;
}

interface SuperAdminDashboardProps {
    t: (key: string, options?: any) => string;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ t }) => {
    document.title = t('super-admin-dashboard') || 'Super Admin Dashboard';

    const [dashboardData, setDashboardData] = useState<DashboardData>({
        totalUsers: 0,
        totalClients: 0,
        totalAdmins: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        recentUsers: [],
        recentClients: [],
        userGrowthChart: [],
        clientGrowthChart: [],
        roleDistribution: [],
        countryDistribution: [],
        clientsByAdmin: []
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const usersResponse = await usersApiService.getAllUsers({});
            const users: User[] = usersResponse.data?.data || [];
            const clientsResponse = await clientApiService.findClients("");
            const clients: Client[] = clientsResponse.data?.data || [];

            const adminUsers = users.filter((user: User) => user.role_id === 1);


            const clientsWithActiveAdmin = clients.filter((client: Client) => {
                const admin = users.find((u: User) => u.user_id === client.admin_id);
                return admin && admin.active === 'Y';
            });

            const totalUsers = adminUsers.length;
            const activeUsers = adminUsers.filter((user: User) => user.active === 'Y').length;
            const verifiedUsers = adminUsers.filter((user: User) => user.is_verified === true).length;
            const unverifiedUsers = totalUsers - verifiedUsers;

            const totalAdmins = adminUsers.length;
            const totalClients = clientsWithActiveAdmin.length;

            const recentUsers = adminUsers
                .sort((a: User, b: User) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);
            const recentClients = clientsWithActiveAdmin
                .sort((a: Client, b: Client) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);

            const userGrowthChart = generateGrowthChart(adminUsers, 'created_at');
            const clientGrowthChart = generateGrowthChart(clientsWithActiveAdmin, 'created_at');

            const roleDistribution: RoleDistribution[] = [
                { name: t('clients') || 'Clients', value: totalClients, color: '#8884d8' },
                { name: t('admins') || 'Admins', value: totalAdmins, color: '#82ca9d' }
            ];

            const countryDistribution = generateCountryDistribution(adminUsers, clientsWithActiveAdmin);
            const clientsByAdmin = generateClientsByAdmin(clientsWithActiveAdmin, adminUsers);

            setDashboardData({
                totalUsers,
                totalClients,
                totalAdmins,
                activeUsers,
                verifiedUsers,
                unverifiedUsers,
                recentUsers,
                recentClients,
                userGrowthChart,
                clientGrowthChart,
                roleDistribution,
                countryDistribution,
                clientsByAdmin
            });

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(t('failed-load-dashboard') || 'Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateGrowthChart = (data: (User | Client)[], dateField: string): ChartData[] => {
        const months: ChartData[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                year: date.getFullYear(),
                monthNum: date.getMonth(),
                count: 0
            });
        }
        data.forEach((item: any) => {
            if (item[dateField]) {
                const itemDate = new Date(item[dateField]);
                const monthIndex = months.findIndex(m =>
                    m.monthNum === itemDate.getMonth() && m.year === itemDate.getFullYear()
                );
                if (monthIndex !== -1) {
                    months[monthIndex].count++;
                }
            }
        });

        return months;
    };

    const generateCountryDistribution = (users: User[], clients: Client[]): CountryDistribution[] => {
        const countries: { [key: string]: { users: number; clients: number } } = {};
        users.forEach((user: User) => {
            const country = user.country || t('unknown') || 'Unknown';
            if (!countries[country]) {
                countries[country] = { users: 0, clients: 0 };
            }
            countries[country].users++;
        });
        clients.forEach((client: Client) => {
            const country = client.country || t('unknown') || 'Unknown';
            if (!countries[country]) {
                countries[country] = { users: 0, clients: 0 };
            }
            countries[country].clients++;
        });

        return Object.entries(countries)
            .map(([country, data]) => ({
                country,
                users: data.users,
                clients: data.clients,
                total: data.users + data.clients
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    };

    const generateClientsByAdmin = (clients: Client[], users: User[]): ClientsByAdmin[] => {
        const adminClients: { [key: number]: ClientsByAdmin } = {};

        clients.forEach((client: Client) => {
            const adminId = client.admin_id;
            const admin = users.find((u: User) => u.user_id === adminId);

            if (admin && admin.active === 'Y') {
                if (!adminClients[adminId]) {
                    adminClients[adminId] = {
                        adminId,
                        adminName: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || (t('unknown') || 'Unknown'),
                        clientCount: 0
                    };
                }
                adminClients[adminId].clientCount++;
            }
        });

        return Object.values(adminClients)
            .sort((a: ClientsByAdmin, b: ClientsByAdmin) => b.clientCount - a.clientCount)
            .slice(0, 10);
    };

    const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle, percentage }) => (
        <Card className="border-0 shadow-sm h-100">
            <Card.Body>
                <div className="d-flex align-items-center">
                    <div className={`rounded-circle p-3 me-3`} style={{ backgroundColor: `${color}20` }}>
                        <Icon size={24} color={color} />
                    </div>
                    <div className="flex-grow-1">
                        <h6 className="text-muted mb-1">{title}</h6>
                        <h3 className="mb-0">{value}</h3>
                        {subtitle && <small className="text-muted">{subtitle}</small>}
                        {percentage && (
                            <div className="mt-2">
                                <div className="progress" style={{ height: '4px' }}>
                                    <div
                                        className="progress-bar"
                                        role="progressbar"
                                        style={{ width: `${percentage}%`, backgroundColor: color }}
                                    ></div>
                                </div>
                                <small className="text-muted">{percentage}%</small>
                            </div>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow rounded border">
                    <p className="fw-bold mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="mb-0">
                            {entry.name}: <span className="fw-bold">{entry.value}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t('loading') || 'Loading...'}</span>
                        </div>
                        <span className="ms-3">{t('loading-dashboard-data') || 'Loading dashboard data...'}</span>
                    </div>
                </Container>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content">
                <Container fluid>
                    <Alert variant="danger" className="mt-4">
                        <AlertCircle className="me-2" />
                        {error}
                        <button className="btn btn-outline-danger btn-sm ms-3" onClick={fetchDashboardData}>
                            {t('retry') || 'Retry'}
                        </button>
                    </Alert>
                </Container>
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <Row className="mb-4">
                    <Col>
                        <h2 className="fw-bold mb-3">{t('super-admin-dashboard') || 'Super Admin Dashboard'}</h2>
                        <p className="text-muted">{t('monitor-system-performance') || 'Monitor system performance, admin growth, and client analytics'}</p>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col xl={4} md={6} className="mb-3">
                        <StatCard
                            title={t('total-admins') || 'Total Admins'}
                            value={dashboardData.totalUsers.toLocaleString()}
                            icon={Users}
                            color="#3b82f6"
                            subtitle={t('all-registered-admins') || 'All registered admins'}
                        />
                    </Col>
                    <Col xl={4} md={6} className="mb-3">
                        <StatCard
                            title={t('total-clients') || 'Total Clients'}
                            value={dashboardData.totalClients.toLocaleString()}
                            icon={Users}
                            color="#10b981"
                            subtitle={t('registered-clients') || 'Registered clients'}
                        />
                    </Col>
                    <Col xl={4} md={6} className="mb-3">
                        <StatCard
                            title={t('verified-admins') || 'Verified Admins'}
                            value={`${Math.round((dashboardData.verifiedUsers / dashboardData.totalUsers) * 100)}%`}
                            icon={CheckCircle}
                            color="#8b5cf6"
                            subtitle={`${dashboardData.verifiedUsers} ${t('of') || 'of'} ${dashboardData.totalUsers}`}
                            percentage={Math.round((dashboardData.verifiedUsers / dashboardData.totalUsers) * 100)}
                        />
                    </Col>
                </Row>
                <Row className="mb-4">
                    <Col xl={6} className="mb-3">
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">{t('admin-registration-growth') || 'Admin Registration Growth'}</h5>
                                <small className="text-muted">{t('monthly-admin-registrations') || 'Monthly admin registrations (last 6 months)'}</small>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={dashboardData.userGrowthChart}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#3b82f6"
                                            fill="#3b82f6"
                                            fillOpacity={0.6}
                                            name={t('admins') || 'Admins'}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={6} className="mb-3">
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">{t('client-registration-growth') || 'Client Registration Growth'}</h5>
                                <small className="text-muted">{t('monthly-client-registrations') || 'Monthly client registrations (last 6 months)'}</small>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={dashboardData.clientGrowthChart}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#10b981"
                                            fill="#10b981"
                                            fillOpacity={0.6}
                                            name={t('clients') || 'Clients'}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-4">
                    <Col xl={4} className="mb-3">
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">{t('user-distribution') || 'User Distribution'}</h5>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={dashboardData.roleDistribution}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label
                                        >
                                            {dashboardData.roleDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={8} className="mb-3">
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">{t('geographic-distribution') || 'Geographic Distribution'}</h5>
                                <small className="text-muted">{t('admins-clients-by-country') || 'Admins and clients by country'}</small>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={dashboardData.countryDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="country" />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="users" fill="#3b82f6" name={t('admins') || 'Admins'} />
                                        <Bar dataKey="clients" fill="#10b981" name={t('clients') || 'Clients'} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                <Row className="mb-6">
                    <Col xl={6} className="mb-3">
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">{t('clients-by-admin') || 'Clients by Admin'}</h5>
                                <small className="text-muted">{t('top-admins-by-client-count') || 'Top admins by client count'}</small>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <Table hover responsive>
                                        <thead>
                                        <tr>
                                            <th>{t('admin-name') || 'Admin Name'}</th>
                                            <th>{t('client-count') || 'Client Count'}</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {dashboardData.clientsByAdmin.length > 0 ? (
                                            dashboardData.clientsByAdmin.map((admin, index) => (
                                                <tr key={index}>
                                                    <td>{admin.adminName}</td>
                                                    <td>
                                                        <Badge bg="primary">{admin.clientCount}</Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={2} className="text-center text-muted py-4">
                                                    {t('no-data-available') || 'No data available'}
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default withTranslation()(SuperAdminDashboard);