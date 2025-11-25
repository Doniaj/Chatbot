const {} = require("http-errors")
let bcrypt = require('bcryptjs');

module.exports = (sequelize, Sequelize) => {
    const user = sequelize.define("users", {
            user_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            username: {
                type: Sequelize.STRING
            },
            password_hash: {
                allowNull: true,
                type: Sequelize.STRING
            },
            first_name: {
                type: Sequelize.STRING
            },
            last_name: {
                type: Sequelize.STRING
            },
            email: {
                type: Sequelize.STRING
            },
            role_id: {
                type: Sequelize.INTEGER
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            current_session_token: {
                allowNull: true,
                type: Sequelize.STRING
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date()
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date()

            },
            solde: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            address: {
                allowNull: true,
                type: Sequelize.STRING
            },
            phone_number: {
                allowNull: true,
                type: Sequelize.STRING
            },
            token_reset_password : {
                allowNull: true,
                type: Sequelize.STRING
            },
            token_verify_account : {
                allowNull: true,
                type: Sequelize.STRING
            },
            is_verified : {
                allowNull: true,
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            country_code: {
                allowNull: true,
                type: Sequelize.STRING
            },
            country: {
                allowNull: true,
                type: Sequelize.STRING
            },
            working_hours: {
                allowNull: true,
                type: Sequelize.JSON,
                defaultValue: null,
                comment: 'JSON structure for user working hours'
            },
            admin_id: {
                allowNull: true,
                type: Sequelize.INTEGER,
                references: {
                    model: "users",
                    key: "user_id"
                },
            },
            appointment_duration: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
        },
        {timestamps: false})

    user.prototype.fields = [
        'user_id',
        'username',
        'password_hash',
        'first_name',
        'last_name',
        'email',
        'role_id',
        'status',
        'active',
        'created_at',
        'updated_at',
        'current_session_token',
        'solde',
        "address",
        "phone_number",
        "token_reset_password",
        "is_verified",
        "token_verify_account",
        "country_code",
        "country",
        'working_hours'
    ]
    user.prototype.fieldsSearchMetas = [
        'username',
        'first_name',
        'last_name',
        'email',
        'solde',
        "address",
        "phone_number"
    ]
    user.prototype.setPassword_hash = function (password) {
        let salt = bcrypt.genSaltSync();
        this.password_hash = bcrypt.hashSync(password, salt);
    };
    user.prototype.verifyPassword = function (password) {
        return bcrypt.compareSync(password, this.password_hash);
    };
    user.prototype.getModelIncludes = function () {
        return ['roles'];
    };
    user.associate = function (models) {
        user.belongsTo(models.roles, {
            foreignKey: 'role_id'
        });
        user.hasOne(models.workflows, {
            foreignKey: 'user_id'
        });

    };
    return user
}
