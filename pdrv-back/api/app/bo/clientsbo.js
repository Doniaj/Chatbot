const { baseModelbo } = require('./basebo');
const { Op } = require("sequelize");

class ClientBO extends baseModelbo {
    constructor() {
        super('clients', 'id');
        this.baseModal = 'clients';
        this.primaryKey = 'id';
    }


}

module.exports = ClientBO;