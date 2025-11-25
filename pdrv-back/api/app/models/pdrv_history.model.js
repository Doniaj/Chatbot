module.exports = (sequelize, Sequelize) => {
    const pdrv_history = sequelize.define("pdrv_history",
        {
            history_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER,
            },
            workflow_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "workflows",
                    key: "id"
                }
            },
            reason: {
                type: Sequelize.STRING,
                allowNull: false
            },
            action: {
                type: Sequelize.STRING,
                allowNull: false
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
            flow: {
                type: Sequelize.JSONB,
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
        },
        {
            tableName: 'pdrv_history',
            timestamps: false,
        }
    );

    pdrv_history.associate = function (models) {
        pdrv_history.belongsTo(models.workflows, {
            foreignKey: "workflow_id",
            targetKey: "id"
        });
    };

    return pdrv_history;
};