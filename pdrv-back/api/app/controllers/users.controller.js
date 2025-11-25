const usersDao = require('../bo/usersbo');
let _itembo = new usersDao;

module.exports = {
    updateUser: function (req, res, next) {
        _itembo.updateUser(req, res, next)
    },
    update: function (req, res, next) {
        _itembo.update(req, res, next)
    },
    find: function (req, res, next) {
        _itembo.find(req, res, next);
    },
    findById: function (req, res, next) {
        _itembo.findById(req, res, next);
    },
    addUser: function (req, res, next) {
        _itembo.addUser(req, res, next);
    },
    delete: function (req, res, next) {
        _itembo.delete(req, res, next);
    },
    verifyToken: function (req, res, next) {
        _itembo.verifyToken(req, res, next)
    },
    login: function (req, res, next) {
        _itembo.login(req, res, next)
    },
    forgotPassword: function (req, res, next) {
        _itembo.forgotPassword(req, res, next)
    },

    resetPassword: function (req, res, next) {
        _itembo.resetPassword(req, res, next)
    },
    verifyResetToken: function (req, res, next) {
        _itembo.verifyResetToken(req, res, next)
    },
    register: function (req, res, next) {
        _itembo.register(req, res, next)
    },
    getAllUsers: function (req, res, next) {
        _itembo.getAllUsers(req, res, next)
    },
    getCurrentUser: function (req, res, next) {
        _itembo.getCurrentUser(req, res, next)
    },
    verifyTokenParams: function (req, res, next) {
        _itembo.verifyTokenParams(req, res, next)
    },


    addWeekWorkingHours: function (req, res, next) {
        _itembo.addWeekWorkingHours(req, res, next)
    },

    addAppointmentDuration: function (req, res, next) {
        _itembo.addAppointmentDuration(req, res, next);
    },
    changePassword: function (req, res, next) {
        _itembo.changePassword(req, res, next)
    },
}