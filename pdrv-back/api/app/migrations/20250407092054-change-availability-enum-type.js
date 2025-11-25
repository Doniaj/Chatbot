'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Check if the new ENUM type exists, if not create it
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_availability_type_new AS ENUM ('leave', 'appointment');
      `);
      console.log('Created new ENUM type enum_availability_type_new');
    } catch (error) {
      console.log('ENUM type enum_availability_type_new already exists, skipping creation');
    }

    // Step 2: Alter the column to use the new type
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE availability 
        ALTER COLUMN type TYPE enum_availability_type_new 
        USING type::text::enum_availability_type_new;
      `);
      console.log('Column type altered to use enum_availability_type_new');
    } catch (error) {
      console.error('Failed to alter column type:', error.message);
      throw error; // Rethrow to fail the migration
    }

    // Step 3: Try to drop the old ENUM type if it's not used elsewhere
    try {
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_availability_type;
      `);
      console.log('Dropped old ENUM type enum_availability_type');
    } catch (error) {
      console.warn('Could not drop the old ENUM type. It might still be in use elsewhere.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert: Create the old type and convert back
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_availability_type AS ENUM ('leave', 'appointment');
      `);
      console.log('Re-created old ENUM type enum_availability_type');
    } catch (error) {
      console.log('ENUM type enum_availability_type already exists, skipping creation');
    }

    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE availability 
        ALTER COLUMN type TYPE enum_availability_type 
        USING type::text::enum_availability_type;
      `);
      console.log('Column type reverted to use enum_availability_type');
    } catch (error) {
      console.error('Failed to revert column type:', error.message);
      throw error; // Rethrow to fail the migration
    }

    try {
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_availability_type_new;
      `);
      console.log('Dropped new ENUM type enum_availability_type_new');
    } catch (error) {
      console.warn('Could not drop the new ENUM type.');
    }
  }
};