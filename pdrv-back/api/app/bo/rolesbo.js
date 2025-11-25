const {baseModelbo} = require('./basebo');

class roles extends baseModelbo {
    constructor() {
        super('roles', 'role_id');
        this.baseModal = "roles";
        this.primaryKey = 'role_id';
    }
}

module.exports = roles;
