const pdrvDao = require('../bo/pdrvbo');
let pdrvInst = new pdrvDao;

module.exports = {
    handleRequest: function (req, res, next) {
        pdrvInst.handleRequest(req, res, next);
    },
    findAll:function(req, res){
        pdrvInst.proposeSoonestAvailableDate(req, res);
    },
    checkAvailabilityForClientProposal:function(req, res){
        pdrvInst.checkDateAvailability(req, res);
    },
    upsertClientByPhone:function(req, res){
        pdrvInst.checkOrCreateClient(req, res);
    }
};
