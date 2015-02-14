"use strict";

var mongoose  = require('mongoose');
var env       = process.env.NODE_ENV || "development";
var config    = require(__dirname + '/../config/config.json')[env];

mongoose.connect(config.connection);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("Connected to MONGO!!");
});

module.exports = db;
