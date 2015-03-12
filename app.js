// New Relic Monitor
require('./utils/newrelic');

// Express and SocketIO
var express = require('express');
var app     = express();
var server  = require('http').Server(app);
var io      = require('socket.io')(server);
var db      = require('./utils/connection');

// Body parser & CORS
var bodyParser = require('body-parser');
var cors       = require('cors');
var emoji      = require('emoji-parser');

// Debug
var DEBUG = app.get('DEBUG');

// Models
var App = require('./models/app');

// Slack logic
var slack = require('./utils/slack');

// App settings
app.set('port', process.env.PORT     || Number(5000));
app.set('env',  process.env.NODE_ENV || 'development');

// Constants
app.set('slack_api_url', 'https://slack.com/api');

// Development only
if ('development' === app.get('env')) {
    var errorhandler = require('errorhandler');
    app.use(errorhandler());
}

db.once('open', function (callback) {
    var listening = server.listen(app.get('port'), function() {

        // keep emoji-images in sync with the official repository
        emoji.init().update();

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
require('./utils/socket')(app, io, slack, App, emoji); // socketIO logic
require('./utils/client')(app, io, slack, App); // sets up endpoints
require('./utils/bot')(slack, App); // Sets bots up

// Catch errors
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// On SIGTERM app
process.on('SIGTERM', function() {
    console.log('Got a SIGTERM');
    slack.disconnectAll();
    server.close.bind(server);
    process.exit(0);
});

// On SIGINT app
process.on('SIGINT', function() {
    console.log('Got a SIGINT');
    slack.disconnectAll();
    server.close.bind(server);
    process.exit(0);
});
