module.exports = (sequelize, Sequelize) => {
    const client = sequelize.define("clients", {
        id: {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
        },
        admin_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "user_id"
            }
        },
        first_name: {
            type: Sequelize.STRING
        },
        last_name: {
            type: Sequelize.STRING
        },
        phone_number: {
            allowNull: true,
            type: Sequelize.STRING
        },
        country_code: {
            allowNull: true,
            type: Sequelize.STRING
        },
        country: {
            allowNull: true,
            type: Sequelize.STRING
        },
        birthday: {
            allowNull: true,
            type: Sequelize.DATEONLY
        },
        insurance_id: {
            allowNull: true,
            type: Sequelize.STRING
        },
        active: {
            allowNull: true,
            type: Sequelize.STRING,
            defaultValue: 'Y'
        },
        status: {
            allowNull: true,
            type: Sequelize.STRING,
            defaultValue: 'Y'
        },
        created_at: {
            allowNull: true,
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            allowNull: true,
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: false,
    });

    client.prototype.fields = [
        "id",
        "admin_id",
        "first_name",
        "last_name",
        "phone_number",
        "country_code",
        "country",
        "birthday",
        "insurance_id",
        "active",
        "status",
        "created_at",
        "updated_at"
    ];

    client.associate = function (models) {
        client.belongsTo(models.users, { foreignKey: "admin_id", as: "admin" });
    };

    return client;
};