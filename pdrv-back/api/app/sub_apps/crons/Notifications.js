const db = require("../../models");
const { baseModelbo } = require("../../bo/basebo");
const moment = require("moment");
require("moment-timezone");
const appSocket = require("../../providers/AppSocket");

class Notifications extends baseModelbo {
    constructor() {
        super('notifications', 'id');
        this.baseModal = 'notifications';
        this.primaryKey = 'id';
    }

    async notification() {
        try {

            const now = moment().tz('Europe/Paris');
            const startWindow = now.format('YYYY-MM-DD HH:mm:00');
            const endWindow = now.format('YYYY-MM-DD HH:mm:59');



            const pendingNotifications = await db.notifications.findAll({
                where: {
                    is_sent: false,
                    scheduled_for: {
                        [db.Sequelize.Op.between]: [startWindow, endWindow]
                    },
                    active: 'Y',
                    status: 'Y'
                },
                include: [
                    {
                        model: db.clients,
                        attributes: ['id', 'first_name', 'last_name', 'phone_number']
                    },
                    {
                        model: db.availability,
                        attributes: ['id', 'start_date', 'end_date', 'start_time', 'end_time', 'type']
                    }
                ]
            });


            for (const notification of pendingNotifications) {
                await this.sendNotification(notification);
            }

            return {
                success: true,
                message: `Processed ${pendingNotifications.length} notifications`
            };
        } catch (error) {
            console.error('[Notifications] Error processing notifications:', error);
            return {
                success: false,
                message: `Error processing notifications: ${error.message}`
            };
        }
    }

    async sendNotification(notification) {
        try {

            const freshNotification = await db.notifications.findByPk(notification.id, {
                include: [
                    { model: db.clients, attributes: ['id', 'first_name', 'last_name', 'phone_number'] },
                    { model: db.availability, attributes: ['id', 'start_date', 'end_date', 'start_time', 'end_time', 'type'] }
                ]
            });

            if (!freshNotification) {
                return false;
            }

            let socketEmitted = false;
            let retryCount = 0;
            const maxRetries = 5;

            while (!socketEmitted && retryCount < maxRetries) {
                try {
                    if (!appSocket.isSocketConnected()) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        appSocket.reconnect();
                        retryCount++;
                        continue;
                    }

                    const eventName = this.getEventNameForNotificationType(freshNotification.type);

                    const dataToSend = {
                        notification: freshNotification.get({ plain: true }),
                        message: freshNotification.message,
                        timestamp: new Date().toISOString()
                    };

                    socketEmitted = true; // Mark as sent, we'll update DB regardless
                    appSocket.emit(eventName, dataToSend);

                } catch (socketErr) {
                    retryCount++;
                    console.error(`[Notifications] Socket error (attempt ${retryCount}):`, socketErr);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            await db.notifications.update(
                {
                    is_sent: true,
                    sent_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                },
                { where: { id: notification.id } }
            );

            return true;
        } catch (error) {
            console.error(`[Notifications] Error sending notification #${notification.id}:`, error);
            return false;
        }
    }

    getEventNameForNotificationType(type) {
        switch (type) {
            case 'appointment_created':
                return 'appointment.created';
            case 'appointment_reminder':
                return 'appointment.reminder';
            default:
                return 'notification.new';
        }
    }



}

module.exports = Notifications;