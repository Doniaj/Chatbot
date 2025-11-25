const {baseModelbo} = require("./basebo");

class WorkflowBO extends baseModelbo {
    constructor() {
        super('workflows', 'id');
        this.baseModal = 'workflows';
        this.primaryKey = 'id';
    }

    getWorkflowsByUserId(req, res, next) {
        let { userId } = req.params;  // Assurez-vous que ça correspond à la route

        if (!userId) {
            return res.status(400).send({
                success: false,
                message: 'User ID is required',
            });
        }

        this.db['workflows'].findAll({
            where: {
                user_id: userId,
                active: 'Y'
            }
        })
            .then(workflows => {
                return res.send({
                    success: true,
                    data: workflows
                });
            })
            .catch(err => {
                return this.sendResponseError(res, ['Database error', err], 4, 500);
            });
    }





}

module.exports = WorkflowBO;