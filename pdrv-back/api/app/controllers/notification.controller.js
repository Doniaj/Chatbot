const NotificationBO = require('../bo/notificationbo');
let notificationBOInst = new NotificationBO();

module.exports = {
    getNotifications: function (req, res, next) {
        notificationBOInst.getAdminNotifications(req, res, next);
    },
    getUnreadCount: function (req, res, next) {
        notificationBOInst.getUnreadCount(req, res, next);
    },
    markAsRead: function (req, res, next) {
        notificationBOInst.markAsRead(req, res, next);
    },
    markAllAsRead: function (req, res, next) {
        notificationBOInst.markAllAsRead(req, res, next);
    },
    delete: function (req, res, next) {
        notificationBOInst.delete(req, res, next);
    },
    find: function (req, res, next) {
        notificationBOInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        notificationBOInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        notificationBOInst.save(req, res, next);
    },

};