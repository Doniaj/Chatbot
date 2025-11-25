const Notification = require("./Notifications");
const Cron = require('cron').CronJob;
const moment = require('moment-timezone');
const db = require("../../models");
const appSocket = require("../../providers/AppSocket");

let notificationHandler = new Notification();

let Process_Notifications = new Cron("* * * * *", async function () {

    try {
        const serverTime = new Date();
        const now = moment().tz('Europe/Paris');
        const currentTime = now.format('YYYY-MM-DD HH:mm:ss');



        const startMinute = now.clone().seconds(0).format('YYYY-MM-DD HH:mm:00');
        const endMinute = now.clone().seconds(59).format('YYYY-MM-DD HH:mm:59');


        const pendingNotifications = await db.notifications.findAll({
            where: {
                is_sent: false,
                scheduled_for: {
                    [db.Sequelize.Op.between]: [startMinute, endMinute]
                },
                active: 'Y',
                status: 'Y',
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

            if (notification.type === 'appointment_reminder') {

                if (!notification.availability || !notification.availability.start_date) {
                    await db.notifications.update(
                        { is_sent: true, sent_at: currentTime },
                        { where: { id: notification.id } }
                    );
                    continue;
                }

                const appointmentTime = moment.tz(
                    `${notification.availability.start_date} ${notification.availability.start_time}`,
                    'YYYY-MM-DD HH:mm:ss',
                    'Europe/Paris'
                );

                const minutesUntilAppointment = appointmentTime.diff(now, 'minutes');

                if (minutesUntilAppointment < 14 || minutesUntilAppointment > 16) {
                    continue;
                }

            }



            try {
                await db.notifications.update(
                    {
                        is_sent: true,
                        is_read: false,
                        sent_at: currentTime,
                        updated_at: currentTime
                    },
                    { where: { id: notification.id } }
                );


                const sendResult = await notificationHandler.sendNotification(notification);

            } catch (updateError) {
            }
        }

        return {
            success: true,
            message: `Processed ${pendingNotifications.length} notifications`
        };
    } catch (error) {
        return {
            success: false,
            message: `Error processing notifications: ${error.message}`
        };
    }
}, null, true, 'Europe/Paris');

let Ensure_Reminders = new Cron("*/2 * * * *", async function () {  // Changed from "*/1 * * * *"

    try {
        const now = moment().tz('Europe/Paris');
        const currentDate = now.format('YYYY-MM-DD');
        const currentTime = now.format('HH:mm:ss');


        const upcomingAppointments = await db.availability.findAll({
            where: {
                type: 'appointment',
                active: 'Y',
                status: 'Y',
                [db.Sequelize.Op.or]: [
                    {
                        start_date: currentDate,
                        start_time: {
                            [db.Sequelize.Op.gt]: currentTime
                        }
                    },
                    {
                        start_date: {
                            [db.Sequelize.Op.gt]: currentDate,
                            [db.Sequelize.Op.lte]: moment(now).add(3, 'days').format('YYYY-MM-DD')
                        }
                    }
                ]
            },
            include: [
                {
                    model: db.clients,
                    attributes: ['id', 'first_name', 'last_name', 'phone_number']
                }
            ]
        });


        let remindersCreated = 0;
        let remindersUpdated = 0;
        let remindersSkipped = 0;

        for (const appointment of upcomingAppointments) {
            const appointmentData = appointment.get({ plain: true });

            const appointmentTime = moment.tz(
                `${appointmentData.start_date} ${appointmentData.start_time}`,
                'YYYY-MM-DD HH:mm:ss',
                'Europe/Paris'
            );
            const minutesUntilAppointment = appointmentTime.diff(now, 'minutes');


            if (minutesUntilAppointment < 10) {
                remindersSkipped++;
                continue;
            }

            // IMPORTANT: Check for ANY existing reminder (sent OR unsent)
            const existingReminder = await db.notifications.findOne({
                where: {
                    availability_id: appointmentData.id,
                    type: 'appointment_reminder',
                    active: 'Y'
                }
            });

            if (existingReminder) {
                if (existingReminder.is_sent) {
                    remindersSkipped++;
                    continue;
                } else {
                    const clientName = appointmentData.client ?
                        `${appointmentData.client.first_name} ${appointmentData.client.last_name}` :
                        'a client';

                    const reminderTime = moment(appointmentTime).subtract(15, 'minutes');
                    reminderTime.seconds(0);
                    const scheduledTime = reminderTime.format('YYYY-MM-DD HH:mm:00');

                    if (existingReminder.scheduled_for !== scheduledTime ||
                        !existingReminder.message.includes(clientName)) {


                        await db.notifications.update(
                            {
                                scheduled_for: scheduledTime,
                                message: `Reminder: You have an appointment with ${clientName} in 15 minutes (${appointmentData.start_time})`,
                                is_read: false,
                                updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                            },
                            { where: { id: existingReminder.id } }
                        );
                        remindersUpdated++;
                    } else {
                        remindersSkipped++;
                    }
                    continue; // Skip creating a new reminder
                }
            }

            const clientName = appointmentData.client ?
                `${appointmentData.client.first_name} ${appointmentData.client.last_name}` :
                'a client';

            const reminderTime = moment(appointmentTime).subtract(15, 'minutes');
            reminderTime.seconds(0);
            const scheduledTime = reminderTime.format('YYYY-MM-DD HH:mm:00');


            const notificationData = {
                admin_id: appointmentData.user_id,
                availability_id: appointmentData.id,
                client_id: appointmentData.client_id,
                type: 'appointment_reminder',
                title: '15-Minute Appointment Reminder',
                message: `Reminder: You have an appointment with ${clientName} in 15 minutes (${appointmentData.start_time})`,
                scheduled_for: scheduledTime,
                is_read: false,
                is_sent: false,
                sent_at: null,
                active: 'Y',
                status: 'Y',
                created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            await db.notifications.create(notificationData);
            remindersCreated++;
        }

        const inconsistentReminders = await db.notifications.findAll({
            where: {
                type: 'appointment_reminder',
                is_sent: false,
                is_read: true,
                active: 'Y'
            }
        });

        if (inconsistentReminders.length > 0) {

            for (const reminder of inconsistentReminders) {

                await db.notifications.update(
                    {
                        is_read: false,
                        updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                    },
                    { where: { id: reminder.id } }
                );
            }
        }

        return true;
    } catch (error) {
        return false;
    }
}, null, true, 'Europe/Paris');

const notificationService = {
    createAppointmentNotification: async (appointmentData) => {
        try {
            const { id, user_id, client_id, start_date, start_time } = appointmentData;

            const clientName = appointmentData.client ?
                `${appointmentData.client.first_name} ${appointmentData.client.last_name}` :
                'a client';

            const notificationData = {
                admin_id: user_id,
                availability_id: id,
                client_id: client_id,
                type: 'appointment_created',
                title: 'New Appointment Created',
                message: `New appointment has been created with ${clientName} on ${start_date} at ${start_time}`,
                scheduled_for: moment().tz('Europe/Paris').format('YYYY-MM-DD HH:mm:ss'), // Schedule immediately
                is_read: false,
                is_sent: false,
                sent_at: null, // FIXED: Explicitly set to null
                active: 'Y',
                status: 'Y',
                created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            const createdNotification = await db.notifications.create(notificationData);

            await db.notifications.update(
                {
                    is_sent: true,
                    sent_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                },
                { where: { id: createdNotification.id } }
            );


            try {
                const notification = await db.notifications.findByPk(createdNotification.id, {
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

                if (notification) {
                    await notificationHandler.sendNotification(notification);
                }
            } catch (socketError) {
            }

            return createdNotification;
        } catch (error) {
            throw error;
        }
    },

    scheduleAppointmentReminders: async (appointmentData) => {
        try {
            const { id, user_id, client_id, start_date, start_time } = appointmentData;

            const appointmentTime = moment.tz(
                `${start_date} ${start_time}`,
                'YYYY-MM-DD HH:mm:ss',
                'Europe/Paris'
            );
            const currentTime = moment().tz('Europe/Paris');
            const minutesDiff = appointmentTime.diff(currentTime, 'minutes');


            if (minutesDiff < 10) {  // Changed from 20 to 10 to match Ensure_Reminders
                return null;
            }

            const anyExistingReminder = await db.notifications.findOne({
                where: {
                    availability_id: id,
                    type: 'appointment_reminder',
                    active: 'Y'
                }
            });

            if (anyExistingReminder) {
                return anyExistingReminder;
            }

            const reminderTime = moment(appointmentTime).subtract(15, 'minutes');
            reminderTime.seconds(0);
            const scheduledTime = reminderTime.format('YYYY-MM-DD HH:mm:00');

            const clientName = appointmentData.client ?
                `${appointmentData.client.first_name} ${appointmentData.client.last_name}` :
                'a client';

            const notificationData = {
                admin_id: user_id,
                availability_id: id,
                client_id: client_id,
                type: 'appointment_reminder',
                title: '15-Minute Appointment Reminder',
                message: `Reminder: You have an appointment with ${clientName} in 15 minutes (${start_time})`,
                scheduled_for: scheduledTime,
                is_read: false,
                is_sent: false,
                sent_at: null,
                active: 'Y',
                status: 'Y',
                created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            const createdNotification = await db.notifications.create(notificationData);

            return createdNotification;
        } catch (error) {
            throw error;
        }
    }
};

const validateAndFixAllNotifications = async () => {

    try {

        const inconsistentNotifications = await db.notifications.findAll({
            where: {
                is_sent: false,
                is_read: true,
                active: 'Y'
            }
        });

        if (inconsistentNotifications.length > 0) {

            for (const notification of inconsistentNotifications) {

                await db.notifications.update(
                    {
                        is_read: false,
                        updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                    },
                    { where: { id: notification.id } }
                );

            }
        } else {
        }


        const missingSentAtNotifications = await db.notifications.findAll({
            where: {
                is_sent: true,
                sent_at: null,
                active: 'Y'
            }
        });

        if (missingSentAtNotifications.length > 0) {

            for (const notification of missingSentAtNotifications) {

                await db.notifications.update(
                    {
                        sent_at: notification.updated_at || moment().format('YYYY-MM-DD HH:mm:ss'),
                        updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                    },
                    { where: { id: notification.id } }
                );

            }
        } else {
        }

        // 3. Check for duplicate reminder notifications for the same appointment

        const allUnsentReminders = await db.notifications.findAll({
            where: {
                type: 'appointment_reminder',
                is_sent: false,
                active: 'Y'
            },
            order: [['created_at', 'DESC']]
        });

        const remindersByAppointment = {};
        allUnsentReminders.forEach(reminder => {
            if (!remindersByAppointment[reminder.availability_id]) {
                remindersByAppointment[reminder.availability_id] = [];
            }
            remindersByAppointment[reminder.availability_id].push(reminder);
        });

        let duplicatesFixed = 0;
        for (const [appointmentId, reminders] of Object.entries(remindersByAppointment)) {
            if (reminders.length > 1) {

                const keepReminder = reminders[0];
                const duplicateReminders = reminders.slice(1);


                for (const duplicate of duplicateReminders) {
                    await db.notifications.update(
                        {
                            active: 'N',
                            status: 'N',
                            updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                        },
                        { where: { id: duplicate.id } }
                    );

                    duplicatesFixed++;
                }
            }
        }

        if (duplicatesFixed === 0) {
        } else {
        }

        // 4. Check for appointments that have inconsistent reminders (e.g., sent and unsent)

        const allAppointmentsWithReminders = await db.availability.findAll({
            where: {
                type: 'appointment',
                active: 'Y'
            },
            include: [
                {
                    model: db.notifications,
                    where: {
                        type: 'appointment_reminder',
                        active: 'Y'
                    },
                    required: true
                }
            ]
        });

        let inconsistentAppointmentsFixed = 0;

        for (const appointment of allAppointmentsWithReminders) {
            const sentReminders = appointment.notifications.filter(n => n.is_sent === true);
            const unsentReminders = appointment.notifications.filter(n => n.is_sent === false);

            if (sentReminders.length > 0 && unsentReminders.length > 0) {

                // If there are both sent and unsent reminders, deactivate the unsent ones
                for (const unsentReminder of unsentReminders) {

                    await db.notifications.update(
                        {
                            active: 'N',
                            status: 'N',
                            updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                        },
                        { where: { id: unsentReminder.id } }
                    );

                    inconsistentAppointmentsFixed++;
                }
            }
        }

        if (inconsistentAppointmentsFixed === 0) {
        } else {
        }

        // 5. Check for outdated scheduled reminder times

        const futureAppointments = await db.availability.findAll({
            where: {
                type: 'appointment',
                active: 'Y',
                status: 'Y',
                start_date: {
                    [db.Sequelize.Op.gte]: moment().format('YYYY-MM-DD')
                }
            },
            include: [
                {
                    model: db.notifications,
                    where: {
                        type: 'appointment_reminder',
                        is_sent: false,
                        active: 'Y'
                    },
                    required: true
                }
            ]
        });

        let scheduledTimesFixed = 0;

        for (const appointment of futureAppointments) {
            // Get the appointment date/time
            const appointmentTime = moment.tz(
                `${appointment.start_date} ${appointment.start_time}`,
                'YYYY-MM-DD HH:mm:ss',
                'Europe/Paris'
            );

            const correctReminderTime = moment(appointmentTime).subtract(15, 'minutes');
            const correctScheduledTime = correctReminderTime.format('YYYY-MM-DD HH:mm:ss');

            for (const reminder of appointment.notifications) {
                if (reminder.scheduled_for !== correctScheduledTime) {

                    await db.notifications.update(
                        {
                            scheduled_for: correctScheduledTime,
                            updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                        },
                        { where: { id: reminder.id } }
                    );

                    scheduledTimesFixed++;
                }
            }
        }

        if (scheduledTimesFixed === 0) {
        } else {
        }

        return {
            success: true,
            inconsistentNotificationsFixed: inconsistentNotifications.length,
            missingSentAtFixed: missingSentAtNotifications.length,
            duplicateRemindersFixed: duplicatesFixed,
            inconsistentAppointmentsFixed: inconsistentAppointmentsFixed,
            scheduledTimesFixed: scheduledTimesFixed
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};



validateAndFixAllNotifications()
    .then(result => {
    })
    .catch(error => {
    });

Process_Notifications.start();
Ensure_Reminders.start();

module.exports = {
    notificationService,
    Process_Notifications,
    Ensure_Reminders,
    validateAndFixAllNotifications
};