module.exports = (sequelize, Sequelize) => {
    const notification = sequelize.define("notifications", {
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
        availability_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "availability",
                key: "id"
            }
        },
        client_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "clients",
                key: "id"
            }
        },
        type: {
            type: Sequelize.ENUM("appointment_reminder", "appointment_created"),
            allowNull: false
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        message: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        scheduled_for: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'When the notification should be sent'
        },
        is_read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        is_sent: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        sent_at: {
            type: Sequelize.DATE,
            allowNull: true
        },
        active: {
            type: Sequelize.STRING,
            defaultValue: 'Y'
        },
        status: {
            type: Sequelize.STRING,
            defaultValue: 'Y'
        },
        created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: false,
        tableName: 'notifications'
    });

    notification.prototype.fields = [
        "id",
        "admin_id",
        "availability_id",
        "client_id",
        "type",
        "title",
        "message",
        "scheduled_for",
        "is_read",
        "is_sent",
        "sent_at",
        "active",
        "status",
        "created_at",
        "updated_at"
    ];

    notification.associate = function (models) {
        notification.belongsTo(models.users, { foreignKey: "admin_id", as: "admin" });
        notification.belongsTo(models.availability, { foreignKey: "availability_id" });
        notification.belongsTo(models.clients, { foreignKey: "client_id" });
    };

    return notification;
};