'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.createTable('users', {
            user_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            username: {
                type: Sequelize.STRING
            },
            password_hash: {
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
            working_hours: {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
                comment: 'JSON structure for user working hours'
            },
            status: {
                type: Sequelize.STRING(1),
                defaultValue: 'Y',
                allowNull: true,
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING(1),
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
            profile_image_id: {
                type: Sequelize.INTEGER
            }
        }).then(() => {
            queryInterface.bulkInsert("users",
                [
                    {
                        "username": "admin",
                        "password_hash": "$2b$10$TOzGnzuUQjfTzmecOw7NKe0ub6zPrRREXPRgLNkRWeUJtMZ1KUoeq",
                        "active": "Y",
                        "role_id": 1,
                        "first_name": "admin",
                        "last_name": "fonitex",
                        "email": "admin@fonitex.com",
                        "status": "Y",
                        "working_hours": JSON.stringify({
                            "monday": {"start": "09:00", "end": "17:00"},
                            "tuesday": {"start": "09:00", "end": "17:00"},
                            "wednesday": {"start": "09:00", "end": "17:00"},
                            "thursday": {"start": "09:00", "end": "17:00"},
                            "friday": {"start": "09:00", "end": "17:00"},
                            "saturday": null,
                            "sunday": null
                        })
                    }
                ]);
        });
    },

    async down(queryInterface, Sequelize) {
        return queryInterface.dropTable('users');
    }
};