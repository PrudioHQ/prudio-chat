// New Relic Monitor
require('./utils/newrelic');

// Express
var express = require('express');
var app     = express();
var server  = require('http').Server(app);
var db      = require('./utils/connection');

// Body parser & CORS
var bodyParser = require('body-parser');
var cors       = require('cors');
var rollbar    = require('rollbar');

// Debug
var DEBUG = app.get('DEBUG');

// Models
var App     = require('./models/app');
var Servers = require('./models/server');

// App settings
app.set('port', process.env.PORT     || Number(5000));
app.set('env',  process.env.NODE_ENV || 'development');

// Development only
if ('development' === app.get('env')) {
    var errorhandler = require('errorhandler');
    app.use(errorhandler());
}

db.once('open', function (callback) {
    var listening = server.listen(app.get('port'), function() {

        console.log('Express server listening on port ' + listening.address().port);

        // If in heroku inform which DYNO is running
        if (process.env.DYNO) {
            console.log('I\'m running at ' + process.env.DYNO);
        }

        // Hide the console.log() function in production
        if ('production' === app.get('env')) {
            console = console || {};
            console.log = function(){};
        }
    });
});

app.enable('trust proxy');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// allow access to /build directories and notification
app.use('/', express.static(__dirname + '/build'));

if ('development' === app.get('env')) {
    // HTML client
    app.use('/client-html',  express.static(__dirname + '/client-html'));
}

// linking
require('./utils/client')(app, App, Servers); // sets up endpoints

// Rollbar Error Handling
app.use(rollbar.errorHandler(process.env.ROLLBAR_ACCESS_TOKEN));

// On SIGTERM app
process.on('SIGTERM', function() {
    console.log('Got a SIGTERM');
    server.close.bind(server);
    process.exit(0);
});

// On SIGINT app
process.on('SIGINT', function() {
    console.log('Got a SIGINT');
    server.close.bind(server);
    process.exit(0);
});
