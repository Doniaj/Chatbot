module.exports = (sequelize, Sequelize) => {
    const availability = sequelize.define("availability", {
        id: {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
        },
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "user_id"
            }
        },
        type: {
            type: Sequelize.ENUM("leave", "appointment"),
            allowNull: false
        },
        client_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: "clients",
                key: "id"
            }
        },
        start_date: {
            type: Sequelize.DATEONLY,
            allowNull: true
        },
        end_date: {
            type: Sequelize.DATEONLY,
            allowNull: true
        },
        start_time: {
            type: Sequelize.TIME,
            allowNull: false
        },
        end_time: {
            type: Sequelize.TIME,
            allowNull: false
        },
        appointment_date: {
            type: Sequelize.DATEONLY,
            allowNull: true
        },
        notes: {
            type: Sequelize.TEXT,
            allowNull: true
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
        tableName: 'availability'
    });

    availability.prototype.fields = [
        "id",
        "user_id",
        "type",
        "client_id",
        "start_date",
        "end_date",
        "start_time",
        "end_time",
        "appointment_date",
        "notes",
        "active",
        "status",
        "created_at",
        "updated_at"
    ];

    availability.associate = function (models) {
        availability.belongsTo(models.users, { foreignKey: "user_id" });
        availability.belongsTo(models.clients, { foreignKey: "client_id" });
        availability.hasMany(models.notifications, { foreignKey: "availability_id" });

    };

    return availability;
};