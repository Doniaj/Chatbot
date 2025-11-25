const AvailabilityDao = require('../bo/availabilitybo');
let availabilityDaoInst = new AvailabilityDao();

module.exports = {
    update: function (req, res, next) {
        availabilityDaoInst.updateAvailability(req, res, next);
    },
    find: function (req, res, next) {
        availabilityDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        availabilityDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        availabilityDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        availabilityDaoInst.delete(req, res, next);
    },


};
