var mongoose = require('mongoose');

module.exports = mongoose.model('App',
    mongoose.Schema({
        appId: String,
        name: String,
        active: Boolean,
        online: Boolean,
        join: Boolean,
        slackApiToken: String,
        slackBotToken: String,
        slackInviteUser: String,
        slackInviteBot: String,
        roomPrefix: String,
        roomCount: Number,
        socketURL: String,
        server: String
    },
    {
        collection: 'App' // to match with prudio-app
    })
);
