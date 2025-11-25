'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      availability_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'availability',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('appointment_reminder', 'appointment_created', 'appointment_updated', 'appointment_canceled'),
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
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      },
      status: {
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('notifications', ['admin_id']);
    await queryInterface.addIndex('notifications', ['availability_id']);
    await queryInterface.addIndex('notifications', ['client_id']);
    await queryInterface.addIndex('notifications', ['is_sent', 'scheduled_for']);
    await queryInterface.addIndex('notifications', ['type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('notifications', 'type');

    await queryInterface.dropTable('notifications');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
  }
};