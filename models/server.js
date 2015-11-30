module.exports = function(sequelize, DataTypes) {

    return sequelize.define('Servers', {
        name: {
            type: DataTypes.STRING,
            field: 'name'
        },
        active: {
            type: DataTypes.BOOLEAN,
            field: 'active'
        },
        server: {
            type: DataTypes.STRING,
            field: 'server'
        },
        address: {
            type: DataTypes.STRING,
            field: 'address'
        },
        port: {
            type: DataTypes.INTEGER,
            field: 'port'
        },
        region: {
            type: DataTypes.STRING,
            field: 'region'
        },

    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'servers'
    });
};
