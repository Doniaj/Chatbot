module.exports = (sequelize, Sequelize) => {
    const workflow = sequelize.define("workflows",
        {
            id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id"
                }
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            react_flow: {
                type: Sequelize.JSONB,
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
            timestamps: false,
        }
    );

    // Liste des champs pour les opérations CRUD
    workflow.prototype.fields = [
        "id",
        "user_id",
        "name",
        "description",
        "react_flow",
        "active",
        "status",
        "created_at",
        "updated_at",
    ];
    workflow.associate = function (models) {
        workflow.belongsTo(models.users, {
            foreignKey: "user_id"
        });
    };

    // Champs utilisables pour la recherche
    workflow.prototype.fieldsSearchMetas = ["name", "description"];



    return workflow;
};