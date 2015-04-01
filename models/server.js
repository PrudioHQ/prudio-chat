var mongoose = require('mongoose');

module.exports = mongoose.model('Servers',
    mongoose.Schema({
        active: Boolean,
        name: String,
        server: String,
        address: String,
        port: Number,
        region: String
    },
    {
        collection: 'Servers' // to match with prudio-app
    })
);
