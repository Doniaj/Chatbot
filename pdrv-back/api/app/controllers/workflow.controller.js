const workflowDao = require('../bo/workFlowbo');
let workflow = new workflowDao;

module.exports = {
    save: function (req, res, next) {
        workflow.save(req, res, next);
    },
    getByUserId:  function (req, res , next) {
        workflow.getWorkflowsByUserId(req, res, next);
    },

    update: function (req, res, next) {
        workflow.update(req, res, next);
    },
    delete: function (req, res, next) {
        workflow.delete(req, res, next);
    }
};
