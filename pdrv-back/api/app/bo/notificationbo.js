const { baseModelbo } = require('./basebo');
const { Op } = require("sequelize");
const moment = require("moment");
const { notificationService } = require("../sub_apps/crons/crons");

class NotificationBO extends baseModelbo {
    constructor() {
        super('notifications', 'id');
        this.baseModal = 'notifications';
        this.primaryKey = 'id';
    }

    async getAdminNotifications(req, res, next) {
        try {
            const adminId = req.user.user_id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const isRead = req.query.is_read !== undefined ?
                (req.query.is_read === 'true') : null;

            const whereClause = {
                admin_id: adminId,
                active: 'Y',
                status: 'Y'
            };

            if (isRead !== null) {
                whereClause.is_read = isRead;
            }

            const { count, rows } = await this.db[this.baseModal].findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: this.db.clients,
                        attributes: ['id', 'first_name', 'last_name', 'phone_number']
                    },
                    {
                        model: this.db.availability,
                        attributes: ['id', 'appointment_date', 'start_time', 'end_time', 'type']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            return res.send({
                success: true,
                message: "Notifications retrieved successfully",
                data: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit),
                    data: rows
                }
            });
        } catch (error) {
            console.error("Error retrieving notifications:", error);
            return this.sendResponseError(res, ['Database error', error.message], 4, 500);
        }
    }

    async getUnreadCount(req, res, next) {
        try {
            const adminId = req.user.user_id;

            const count = await this.db[this.baseModal].count({
                where: {
                    admin_id: adminId,
                    is_read: false,
                    active: 'Y',
                    status: 'Y'
                }
            });

            return res.send({
                success: true,
                message: "Unread notification count retrieved successfully",
                data: { count }
            });
        } catch (error) {
            console.error("Error retrieving unread count:", error);
            return this.sendResponseError(res, ['Database error', error.message], 4, 500);
        }
    }

    async markAsRead(req, res, next) {
        try {
            const adminId = req.user.user_id;
            const notificationId = req.params.id;

            const notification = await this.db[this.baseModal].findOne({
                where: {
                    id: notificationId,
                    admin_id: adminId,
                    active: 'Y',
                    status: 'Y'
                }
            });

            if (!notification) {
                return this.sendResponseError(res, ['Notification not found'], 3, 404);
            }

            await this.db[this.baseModal].update(
                {
                    is_read: true,
                    updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                },
                {
                    where: {
                        id: notificationId,
                        admin_id: adminId
                    }
                }
            );

            return res.send({
                success: true,
                message: "Notification marked as read"
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            return this.sendResponseError(res, ['Database error', error.message], 4, 500);
        }
    }

    async markAllAsRead(req, res, next) {
        try {
            const adminId = req.user.user_id;

            const [updatedCount] = await this.db[this.baseModal].update(
                {
                    is_read: true,
                    updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                },
                {
                    where: {
                        admin_id: adminId,
                        is_read: false,
                        active: 'Y',
                        status: 'Y'
                    }
                }
            );

            return res.send({
                success: true,
                message: "All notifications marked as read",
                data: { count: updatedCount }
            });
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            return this.sendResponseError(res, ['Database error', error.message], 4, 500);
        }
    }


}

module.exports = NotificationBO;