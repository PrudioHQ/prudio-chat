
// Set up DB, Express and SocketIO
var http    = require('http');
var express = require('express');
var io      = require('socket.io');
var mysql   = require('mysql');
var async   = require('async');

// XMPP and Request
var request      = require('request'); // github.com/mikeal/request
var bodyParser   = require('body-parser')
var cookieParser = require('cookie-parser')
var evercookie   = require('evercookie');
var xmpp         = require('node-xmpp');

// Sequalize
var Sequelize = require('sequelize')
var models    = require('./models');

var app    = express();
var server = http.createServer(app);

io = io.listen(server, { log: false });

app.set('port', process.env.PORT || Number(8888));
app.set('env',  'development');

// Development only
if ('development' === app.get('env')) {
  var errorhandler = require('errorhandler')
  app.use(errorhandler())
}

models.sequelize.sync().success(function () {
  var server = app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + server.address().port);
  });
});

sequelize = new Sequelize('oghma', 'root', '', {
  dialect: "mysql", // or 'sqlite', 'postgres', 'mariadb'
  port:    3306, // or 5432 (for postgres)
});

sequelize
  .authenticate()
  .complete(function(err) {
    if (!!err) {
      console.log('Unable to connect to the database:', err)
    } else {
      console.log('Connection has been established successfully.')
    }
  });

app.enable('trust proxy');
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(evercookie.backend());

// allow access to /public directories
app.use('/js',  express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));

// client
app.use('/client-html',  express.static(__dirname + '/client-html/index.html'));

// linking
//require('./socket')(app, io, xmpp); // socketIO logic
require('./client')(app, io, request, async, cookieParser); // sets up endpoints
require('./api')(app, io, request, async, cookieParser); // sets up endpoints

// Catch errors
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
