var port = Number(8888);

// Set up Express and SocketIO
var http    = require('http');
var express = require('express');
var io      = require('socket.io');
var mysql   = require('mysql');
var async   = require('async');

// XMPP and Request
var request    = require('request'); // github.com/mikeal/request
var bodyParser = require('body-parser')
var xmpp       = require('node-xmpp');

var app    = express();
var server = http.createServer(app);

io = io.listen(server, { log: false });
server.listen(port);

// DB Connection
var db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'logbox',
  multipleStatements: true
});

db.connect(function(err) {
  if (err) {
    console.error('MySQL error connecting: ' + err.stack);
    return;
  }
  console.log('MySQL conn id ' + db.threadId);
});


app.enable('trust proxy');
app.use(bodyParser.json());

// allow access to /public directories
app.use('/js',  express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));

console.log("Listening on port " + port);
// linking
require('./socket')(app, io, xmpp); // socketIO logic
require('./routes')(app, io, db, request, async); // sets up endpoints

// Catch errors
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
