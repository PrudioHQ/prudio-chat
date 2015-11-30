module.exports = function(sequelize, DataTypes) {

    return sequelize.define('App', {
        appId: {
            type: DataTypes.STRING,
            field: 'app_id'
        },
        name: {
            type: DataTypes.STRING,
            field: 'name'
        },
        active: {
            type: DataTypes.BOOLEAN,
            field: 'active'
        },
        online: {
            type: DataTypes.BOOLEAN,
            field: 'online'
        },
        join: {
            type: DataTypes.BOOLEAN,
            field: 'join'
        },
        slackApiToken: {
            type: DataTypes.STRING,
            field: 'api_token'
        },
        slackBotToken: {
            type: DataTypes.STRING,
            field: 'bot_token'
        },
        slackInviteUser: {
            type: DataTypes.STRING,
            field: 'invite_user'
        },
        slackInviteBot: {
            type: DataTypes.STRING,
            field: 'invite_bot'
        },
        notifyChannel: {
            type: DataTypes.STRING,
            field: 'notify_channel'
        },
        roomPrefix: {
            type: DataTypes.STRING,
            field: 'room_prefix'
        },
        roomCount: {
            type: DataTypes.INTEGER,
            field: 'room_count'
        },
        socketURL: {
            type: DataTypes.STRING,
            field: 'socket_url'
        },
        server: {
            type: DataTypes.STRING,
            field: 'server'
        }
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true, // for the deleted_at
        tableName: 'widgets'
    });
};
