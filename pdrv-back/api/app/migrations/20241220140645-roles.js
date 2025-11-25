'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('roles', {
      role_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      role_name: {
        type: Sequelize.STRING
      },
      permission: {
        type: Sequelize.JSONB
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
      created_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()

      }
    }).then(() => {
      queryInterface.bulkInsert("roles",
          [
            {
              "role_name": "admin",
              "permission": JSON.stringify([]),
              "active": "Y",
              "status": "Y"
            },
            {
              "role_name": "user",
              "permission": JSON.stringify([]),
              "active": "Y",
              "status": "Y"
            }
          ]);
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('roles');
  }
};
