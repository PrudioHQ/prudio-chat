var mongoose = require('mongoose');

module.exports = mongoose.model('App',
    mongoose.Schema({
        appid: String,
        name: String,
        active: Boolean,
        online: Boolean,
        join: Boolean,
        slack_api_token: String,
        slack_bot_token: String,
        slack_invite_user: String,
        slack_invite_bot: String,
        room_prefix: String,
        room_count: Number
    },
    {
        collection: 'App' // to match with prudio-app
    })
);
