
// Set up DB, Express and SocketIO
var express = require('express');
var app     = express();
var server  = require('http').Server(app);
var io      = require('socket.io')(server);
var async   = require('async');

// XMPP and Request
var request      = require('request'); // github.com/mikeal/request
var bodyParser   = require('body-parser')
// var cookieParser = require('cookie-parser')
// var evercookie   = require('evercookie');
var xmpp         = require('node-xmpp');

// Sequalize
var Sequelize = require('sequelize')
var models    = require('./models');

app.set('port', process.env.PORT || Number(8888));
app.set('env',  'development');

// Development only
if ('development' === app.get('env')) {
  var errorhandler = require('errorhandler')
  app.use(errorhandler())
}

models.sequelize.sync().success(function () {
  var listening = server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + listening.address().port);
  });
});

sequelize = new Sequelize('oghma', 'root', '', {
  dialect: "mysql",
  port:    3306, 
});

sequelize
  .authenticate()
  .complete(function(err) {
    if (!!err) {
      console.log('Is MySQL on? Unable to connect to the database: ', err)
    } else {
      console.log('Connection has been established successfully.')
      //require('./migrations/seed')(models); // SEED data
    }
  });

app.enable('trust proxy');
app.use(bodyParser.urlencoded({ extended: false}));
// app.use(cookieParser());
// app.use(evercookie.backend());

// allow access to /public directories
app.use('/js',  express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));

// HTML client
app.use('/client-html',  express.static(__dirname + '/client-html/index.html'));

// linking
require('./socket')(app, io, xmpp); // socketIO logic
require('./client')(app, io, request, models, async); // sets up endpoints
require('./api')   (app, io, request, models); // sets up endpoints

// Catch errors
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// CONST

app.set('slack_channel_prefix', 'sp-');
app.set('slack_api_url',        'https://slack.com/api');

