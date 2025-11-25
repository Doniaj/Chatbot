const { baseModelbo } = require('./basebo');
const { Op } = require("sequelize");
const moment = require("moment");
const { notificationService } = require("../sub_apps/crons/crons");
const appSocket = require("../providers/AppSocket");

class AvailabilityBO extends baseModelbo {
    constructor() {
        super('availability', 'id');
        this.baseModal = 'availability';
        this.primaryKey = 'id';
    }

    async save(req, res, next) {
        try {
            let params = req.body;
            console.log('=== AVAILABILITY SAVE DEBUG ===');
            console.log('Received params:', JSON.stringify(params, null, 2));

            if (!params.user_id) {
                console.log('❌ Validation failed: User ID is required');
                return this.sendResponseError(res, ['User ID is required'], 1, 400);
            }

            if (!params.type) {
                console.log('❌ Validation failed: Type is required');
                return this.sendResponseError(res, ['Type is required'], 1, 400);
            }

            if (!params.start_date || !params.end_date) {
                console.log('❌ Validation failed: Start date and end date are required');
                console.log('start_date:', params.start_date, 'end_date:', params.end_date);
                return this.sendResponseError(res, ['Start date and end date are required'], 1, 400);
            }

            if (params.type === 'appointment' && !params.client_id) {
                console.log('❌ Validation failed: Client ID is required for appointments');
                return this.sendResponseError(res, ['Client ID is required for appointments'], 1, 400);
            }

            const startDate = moment(params.start_date, 'YYYY-MM-DD');
            const endDate = moment(params.end_date, 'YYYY-MM-DD');
            console.log('Date validation - Start:', startDate.format(), 'End:', endDate.format());

            if (endDate.isBefore(startDate)) {
                console.log('❌ Validation failed: End date cannot be earlier than start date');
                return this.sendResponseError(res, ['End date cannot be earlier than start date'], 1, 400);
            }

            // Only validate working hours for appointments, not for leave/unavailable entries
            if (params.type === 'appointment' && params.start_time && params.end_time) {
                console.log('Time validation - Start:', params.start_time, 'End:', params.end_time);

                if (params.start_date === params.end_date) {
                    const startTime = moment(params.start_time, 'HH:mm:ss');
                    const endTime = moment(params.end_time, 'HH:mm:ss');
                    console.log('Same day time validation - Start:', startTime.format(), 'End:', endTime.format());

                    if (endTime.isSameOrBefore(startTime)) {
                        console.log('❌ Validation failed: End time must be after start time');
                        return this.sendResponseError(res, ['End time must be after start time'], 1, 400);
                    }
                }

                console.log('🔍 Fetching user working hours for user_id:', params.user_id);
                const user = await this.db['users'].findOne({
                    where: {
                        user_id: params.user_id,
                        active: 'Y'
                    },
                    attributes: ['user_id', 'working_hours']
                });

                if (!user) {
                    console.log('❌ Validation failed: User not found');
                    return this.sendResponseError(res, ['User not found'], 1, 404);
                }

                console.log('👤 User found:', user.user_id);
                console.log('⏰ Working hours:', JSON.stringify(user.working_hours, null, 2));

                if (user.working_hours && typeof user.working_hours === 'object') {
                    const workingHours = user.working_hours;

                    const appointmentDay = moment(params.start_date).day();
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const dayName = dayNames[appointmentDay];

                    console.log('📅 Appointment day:', dayName, '(', appointmentDay, ')');
                    console.log('📋 Working hours for this day:', JSON.stringify(workingHours[dayName], null, 2));

                    if (workingHours[dayName] && workingHours[dayName].is_working_day) {
                        const workStart = moment(workingHours[dayName].start, 'HH:mm:ss');
                        const workEnd = moment(workingHours[dayName].end, 'HH:mm:ss');
                        const appointmentStart = moment(params.start_time, 'HH:mm:ss');
                        const appointmentEnd = moment(params.end_time, 'HH:mm:ss');

                        console.log('⏰ Work hours:', workStart.format('HH:mm'), '-', workEnd.format('HH:mm'));
                        console.log('📍 Appointment:', appointmentStart.format('HH:mm'), '-', appointmentEnd.format('HH:mm'));

                        if (appointmentStart.isBefore(workStart) || appointmentEnd.isAfter(workEnd)) {
                            console.log('❌ Validation failed: Appointment time outside working hours');
                            return this.sendResponseError(res, [
                                `Appointment time must be within working hours (${workStart.format('HH:mm')} - ${workEnd.format('HH:mm')}) for ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`
                            ], 1, 400);
                        }
                    } else {
                        console.log('❌ Validation failed: User does not work on this day');
                        return this.sendResponseError(res, [
                            `User is not available on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`
                        ], 1, 400);
                    }
                } else {
                    console.log('ℹ️ No working hours defined for user, skipping working hours validation');
                }
            }

            console.log('✅ All validations passed, proceeding with overlap check');

            // Enhanced overlap detection logic
            const overlapCheck = await this.checkForOverlaps(params);
            if (overlapCheck.hasOverlap) {
                console.log('❌ Overlap found:', overlapCheck.conflict.id);
                return res.status(400).send({
                    success: false,
                    message: overlapCheck.message,
                    conflictDetails: overlapCheck.conflict
                });
            }

            console.log('✅ No overlaps found');

            params.active = params.active || 'Y';
            params.status = params.status || 'Y';
            params.created_at = params.created_at || moment().format('YYYY-MM-DD HH:mm:ss');
            params.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');

            console.log('💾 Creating availability record');
            let createdAvailability = await this.db['availability'].create(params);
            console.log('✅ Created availability with ID:', createdAvailability.id);

            if (params.type === 'appointment') {
                try {
                    console.log('📧 Processing appointment notifications');
                    const client = await this.db['clients'].findOne({
                        where: {
                            id: params.client_id,
                            active: 'Y'
                        },
                        attributes: ['id', 'first_name', 'last_name', 'phone_number']
                    });

                    const appointmentData = {
                        ...createdAvailability.dataValues,
                        client: client ? client.dataValues : null
                    };

                    console.log("[AvailabilityBO] Processing appointment creation: ", appointmentData.id);

                    await notificationService.createAppointmentNotification(appointmentData);

                    const appointmentDateTime = `${appointmentData.start_date} ${appointmentData.start_time}`;
                    const appointmentMoment = moment(appointmentDateTime, 'YYYY-MM-DD HH:mm:ss');
                    const currentMoment = moment();

                    console.log(`[AvailabilityBO] Appointment date: ${appointmentMoment.format('YYYY-MM-DD HH:mm:ss')}`);
                    console.log(`[AvailabilityBO] Current date: ${currentMoment.format('YYYY-MM-DD HH:mm:ss')}`);

                    const today = moment().startOf('day');
                    const appointmentDay = moment(appointmentData.start_date).startOf('day');

                    if (appointmentDay.isSame(today) && appointmentMoment.isAfter(currentMoment)) {
                        console.log('[AvailabilityBO] Appointment is today in the future, scheduling reminder');
                        await notificationService.scheduleAppointmentReminders(appointmentData);
                    } else {
                        console.log('[AvailabilityBO] Appointment is for a future date, reminder will be scheduled via cron job');
                    }

                    try {
                        appSocket.emit('appointment.created', appointmentData);
                    } catch (socketError) {
                        console.error("[AvailabilityBO] Socket emission error:", socketError);
                    }
                } catch (notificationError) {
                    console.error("[AvailabilityBO] Error creating notifications:", notificationError);
                }
            }

            console.log('✅ Availability creation completed successfully');
            return res.status(201).send({
                success: true,
                status: 1,
                message: 'Availability created successfully',
                data: {
                    id: createdAvailability.id
                }
            });
        } catch (err) {
            console.error("❌ Database error:", err);
            return this.sendResponseError(res, ['Database error', err.message], 4, 500);
        }
    }


    async checkForOverlaps(params, excludeId = null) {
        console.log('🔍 Checking for overlapping availability with enhanced logic');

        const baseQuery = {
            where: {
                user_id: params.user_id,
                active: 'Y'
            }
        };

        if (excludeId) {
            baseQuery.where.id = { [Op.not]: excludeId };
        }

        // Check for date range overlaps first
        const dateRangeQuery = {
            ...baseQuery,
            where: {
                ...baseQuery.where,
                start_date: { [Op.lte]: params.end_date },
                end_date: { [Op.gte]: params.start_date }
            }
        };

        const potentialConflicts = await this.db['availability'].findAll(dateRangeQuery);
        console.log(`🔍 Found ${potentialConflicts.length} potential conflicts in date range`);

        for (const existing of potentialConflicts) {
            const conflict = this.evaluateConflict(params, existing);
            if (conflict.hasOverlap) {
                return conflict;
            }
        }

        return { hasOverlap: false, conflict: null, message: null };
    }


    evaluateConflict(newEntry, existing) {
        console.log(`🔍 Evaluating conflict between new ${newEntry.type} and existing ${existing.type}`);

        if ((newEntry.type === 'leave' || newEntry.type === 'unavailable') && existing.type === 'appointment' ||
            (existing.type === 'leave' || existing.type === 'unavailable') && newEntry.type === 'appointment') {

            console.log('📋 Checking Leave/Unavailable vs Appointment conflict');

            const leaveEntry = (newEntry.type === 'leave' || newEntry.type === 'unavailable') ? newEntry : existing;
            const appointmentEntry = leaveEntry === newEntry ? existing : newEntry;

            if (leaveEntry.start_date !== leaveEntry.end_date) {
                console.log('📋 Multi-day leave/unavailable conflicts with appointment');
                return {
                    hasOverlap: true,
                    conflict: {
                        id: existing.id,
                        type: existing.type,
                        start_date: existing.start_date,
                        end_date: existing.end_date,
                        start_time: existing.start_time,
                        end_time: existing.end_time
                    },
                    message: `Cannot schedule ${newEntry.type} - user has ${existing.type} during this period`
                };
            }

            if (leaveEntry.start_time && leaveEntry.end_time &&
                appointmentEntry.start_time && appointmentEntry.end_time) {

                const leaveStart = moment(leaveEntry.start_time, 'HH:mm:ss');
                const leaveEnd = moment(leaveEntry.end_time, 'HH:mm:ss');
                const appointmentStart = moment(appointmentEntry.start_time, 'HH:mm:ss');
                const appointmentEnd = moment(appointmentEntry.end_time, 'HH:mm:ss');

                const hasTimeOverlap = appointmentStart.isBefore(leaveEnd) && appointmentEnd.isAfter(leaveStart);

                if (hasTimeOverlap) {
                    console.log('📋 Time overlap detected between leave/unavailable and appointment');
                    return {
                        hasOverlap: true,
                        conflict: {
                            id: existing.id,
                            type: existing.type,
                            start_date: existing.start_date,
                            end_date: existing.end_date,
                            start_time: existing.start_time,
                            end_time: existing.end_time
                        },
                        message: `Time conflict: ${appointmentEntry.type} overlaps with ${leaveEntry.type} period`
                    };
                } else {
                    console.log('📋 No time overlap - appointment is outside leave/unavailable hours');
                    return { hasOverlap: false, conflict: null, message: null };
                }
            }

            if (!leaveEntry.start_time || !leaveEntry.end_time) {
                console.log('📋 Full-day leave/unavailable conflicts with appointment');
                return {
                    hasOverlap: true,
                    conflict: {
                        id: existing.id,
                        type: existing.type,
                        start_date: existing.start_date,
                        end_date: existing.end_date,
                        start_time: existing.start_time,
                        end_time: existing.end_time
                    },
                    message: `Cannot schedule ${newEntry.type} - user has full-day ${existing.type} on this date`
                };
            }

            if (!appointmentEntry.start_time || !appointmentEntry.end_time) {
                console.log('📋 Appointment without time specification - allowing scheduling');
                return { hasOverlap: false, conflict: null, message: null };
            }
        }

        if ((newEntry.type === 'leave' || newEntry.type === 'unavailable') &&
            (existing.type === 'leave' || existing.type === 'unavailable')) {

            console.log('📋 Checking Leave/Unavailable vs Leave/Unavailable conflict');

            if (newEntry.start_date !== newEntry.end_date ||
                existing.start_date !== existing.end_date ||
                newEntry.start_date !== existing.start_date) {

                console.log('📋 Multi-day or different day leave entries conflict');
                return {
                    hasOverlap: true,
                    conflict: {
                        id: existing.id,
                        type: existing.type,
                        start_date: existing.start_date,
                        end_date: existing.end_date,
                        start_time: existing.start_time,
                        end_time: existing.end_time
                    },
                    message: `Cannot schedule ${newEntry.type} - overlaps with existing ${existing.type}`
                };
            }

            if (newEntry.start_time && newEntry.end_time &&
                existing.start_time && existing.end_time) {

                const newStart = moment(newEntry.start_time, 'HH:mm:ss');
                const newEnd = moment(newEntry.end_time, 'HH:mm:ss');
                const existingStart = moment(existing.start_time, 'HH:mm:ss');
                const existingEnd = moment(existing.end_time, 'HH:mm:ss');

                const hasTimeOverlap = newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart);

                if (hasTimeOverlap) {
                    console.log('📋 Time overlap detected between leave/unavailable entries');
                    return {
                        hasOverlap: true,
                        conflict: {
                            id: existing.id,
                            type: existing.type,
                            start_date: existing.start_date,
                            end_date: existing.end_date,
                            start_time: existing.start_time,
                            end_time: existing.end_time
                        },
                        message: `Time conflict: ${newEntry.type} overlaps with existing ${existing.type}`
                    };
                } else {
                    console.log('📋 No time overlap between leave/unavailable entries');
                    return { hasOverlap: false, conflict: null, message: null };
                }
            }

            if (!newEntry.start_time || !newEntry.end_time ||
                !existing.start_time || !existing.end_time) {
                console.log('📋 Full-day leave/unavailable entries conflict');
                return {
                    hasOverlap: true,
                    conflict: {
                        id: existing.id,
                        type: existing.type,
                        start_date: existing.start_date,
                        end_date: existing.end_date,
                        start_time: existing.start_time,
                        end_time: existing.end_time
                    },
                    message: `Cannot schedule ${newEntry.type} - conflicts with existing ${existing.type}`
                };
            }
        }

        if (newEntry.type === 'appointment' && existing.type === 'appointment') {
            if (newEntry.start_date !== newEntry.end_date ||
                existing.start_date !== existing.end_date ||
                newEntry.start_date !== existing.start_date) {
                console.log('📋 Multi-day or different day appointments - no conflict');
                return { hasOverlap: false, conflict: null, message: null };
            }

            if (newEntry.start_time && newEntry.end_time &&
                existing.start_time && existing.end_time) {

                const newStart = moment(newEntry.start_time, 'HH:mm:ss');
                const newEnd = moment(newEntry.end_time, 'HH:mm:ss');
                const existingStart = moment(existing.start_time, 'HH:mm:ss');
                const existingEnd = moment(existing.end_time, 'HH:mm:ss');

                const hasTimeOverlap = newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart);

                if (hasTimeOverlap) {
                    console.log('📋 Appointment time conflict detected');
                    return {
                        hasOverlap: true,
                        conflict: {
                            id: existing.id,
                            type: existing.type,
                            start_date: existing.start_date,
                            end_date: existing.end_date,
                            start_time: existing.start_time,
                            end_time: existing.end_time
                        },
                        message: "Overlapping appointment exists! Please select a different time slot."
                    };
                }
            }
        }

        if (newEntry.type === 'available' && existing.type === 'available') {
            console.log('📋 Available entries can overlap');
            return { hasOverlap: false, conflict: null, message: null };
        }

        console.log('📋 No conflict detected');
        return { hasOverlap: false, conflict: null, message: null };
    }

    async updateAvailability(req, res, next) {
        let params = req.body;
        let availability_id = params.id;
        delete params.id;

        try {
            let availability_item = await this.db['availability'].findOne({
                where: {
                    id: availability_id,
                    active: 'Y'
                }
            });

            if (!availability_item) {
                return this.sendResponseError(res, ['Active availability not found'], 3, 404);
            }

            if (params.start_date && params.end_date) {
                const startDate = moment(params.start_date, 'YYYY-MM-DD');
                const endDate = moment(params.end_date, 'YYYY-MM-DD');

                if (endDate.isBefore(startDate)) {
                    return this.sendResponseError(res, ['End date cannot be earlier than start date'], 1, 400);
                }
            }

            // Merge params with existing data for validation
            const mergedData = {
                user_id: params.user_id || availability_item.user_id,
                type: params.type || availability_item.type,
                start_date: params.start_date || availability_item.start_date,
                end_date: params.end_date || availability_item.end_date,
                start_time: params.start_time || availability_item.start_time,
                end_time: params.end_time || availability_item.end_time,
                client_id: params.client_id || availability_item.client_id
            };

            // Only validate working hours for appointments
            if (mergedData.type === 'appointment' && params.start_time && params.end_time) {
                const dateToCheck = mergedData.start_date;
                const endDateToCheck = mergedData.end_date;

                if (dateToCheck === endDateToCheck) {
                    const startTime = moment(params.start_time, 'HH:mm:ss');
                    const endTime = moment(params.end_time, 'HH:mm:ss');

                    if (endTime.isSameOrBefore(startTime)) {
                        return this.sendResponseError(res, ['End time must be after start time'], 1, 400);
                    }
                }

                const user = await this.db['users'].findOne({
                    where: {
                        user_id: mergedData.user_id,
                        active: 'Y'
                    },
                    attributes: ['user_id', 'working_hours']
                });

                if (!user) {
                    return this.sendResponseError(res, ['User not found'], 1, 404);
                }

                if (user.working_hours && typeof user.working_hours === 'object') {
                    const workingHours = user.working_hours;
                    const appointmentDay = moment(dateToCheck).day();
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const dayName = dayNames[appointmentDay];

                    if (workingHours[dayName] && workingHours[dayName].is_working_day) {
                        const workStart = moment(workingHours[dayName].start, 'HH:mm:ss');
                        const workEnd = moment(workingHours[dayName].end, 'HH:mm:ss');
                        const appointmentStart = moment(params.start_time, 'HH:mm:ss');
                        const appointmentEnd = moment(params.end_time, 'HH:mm:ss');

                        if (appointmentStart.isBefore(workStart) || appointmentEnd.isAfter(workEnd)) {
                            return this.sendResponseError(res, [
                                `Appointment time must be within working hours (${workStart.format('HH:mm')} - ${workEnd.format('HH:mm')}) for ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`
                            ], 1, 400);
                        }
                    } else {
                        return this.sendResponseError(res, [
                            `User is not available on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`
                        ], 1, 400);
                    }
                }
            }

            // Check for overlaps using enhanced logic
            const overlapCheck = await this.checkForOverlaps(mergedData, availability_id);
            if (overlapCheck.hasOverlap) {
                return res.status(400).send({
                    success: false,
                    message: overlapCheck.message,
                    conflictDetails: overlapCheck.conflict
                });
            }

            delete params.created_at;
            params.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');

            let [updated] = await this.db['availability'].update(params, {
                where: {
                    id: availability_id,
                    active: 'Y'
                }
            });

            if (updated) {
                if (availability_item.type === 'appointment') {
                    const updatedAppointment = await this.db['availability'].findOne({
                        where: { id: availability_id },
                        include: [
                            {
                                model: this.db['clients'],
                                attributes: ['id', 'first_name', 'last_name', 'phone_number']
                            }
                        ]
                    });

                    if (updatedAppointment) {
                        await this.updateAppointmentReminders(updatedAppointment);
                    }
                }

                return res.send({
                    success: true,
                    message: 'Availability updated successfully'
                });
            } else {
                return this.sendResponseError(res, ['No changes were made'], 1, 400);
            }
        } catch (err) {
            console.error("Database error:", err);
            return this.sendResponseError(res, ['Database error', err.message], 4, 500);
        }
    }

    async updateAppointmentReminders(appointmentData) {
        try {
            console.log(`[AvailabilityBO] Checking for reminders to update for appointment #${appointmentData.id}`);

            // Find any unsent reminder for this appointment
            const existingReminder = await this.db['notifications'].findOne({
                where: {
                    availability_id: appointmentData.id,
                    type: 'appointment_reminder',
                    is_sent: false,
                    active: 'Y',
                    status: 'Y'
                }
            });

            if (existingReminder) {
                console.log(`[AvailabilityBO] Found existing reminder #${existingReminder.id} to update`);

                // Re-schedule the reminder based on updated appointment time
                await notificationService.scheduleAppointmentReminders(appointmentData);
            } else {
                console.log(`[AvailabilityBO] No unsent reminders found for appointment #${appointmentData.id}`);

                // Check if appointment is in future and qualifies for a reminder
                const appointmentTime = moment(`${appointmentData.start_date} ${appointmentData.start_time}`, 'YYYY-MM-DD HH:mm:ss');
                const now = moment();
                const minutesUntil = appointmentTime.diff(now, 'minutes');

                if (minutesUntil > 20) {
                    console.log(`[AvailabilityBO] Appointment is ${minutesUntil} minutes in future, creating new reminder`);
                    await notificationService.scheduleAppointmentReminders(appointmentData);
                }
            }

            return true;
        } catch (error) {
            console.error(`[AvailabilityBO] Error updating appointment reminders:`, error);
            return false;
        }
    }
}

module.exports = AvailabilityBO;