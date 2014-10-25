var emitter   = require('./utils/emitter');
var irc       = require('irc');
var moment    = require('moment');
var WebSocket = require('ws');

// Private
var Bots = {}; 

// Size of an object
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

// Public
var self = module.exports = {

  size: function size() {
  	return Object.size(Bots);
  },

  isConnected: function isConnected(appid) {
  	if(typeof Bots[appid] === 'undefined')
  		return false;
  	return Bots[appid].isConnected;
  },

  listUsers: function listUsers(appid) {
  	if(typeof Bots[appid] === 'undefined')
  		return [];

  	Bots[appid].send('NAMES');
  },
  
  joinChannel: function joinChannel(appid, channel) {
  	if(typeof Bots[appid] === 'undefined')
  		return false;

  	return Bots[appid].join(channel);
  },

  inviteUser: function inviteUser(appid, user, channel) {
  	if(typeof Bots[appid] === 'undefined')
  		return false;

  	Bots[appid].send('INVITE', user, channel);
  },
  
  setTopic: function setTopic(appid, channel, topic) {
  	if(typeof Bots[appid] === 'undefined')
  		return false;

  	Bots[appid].send('TOPIC', channel, topic);
  },

  connect: function connect(appid, connection) {

    console.log("Connecting to " + appid);

	if(typeof Bots[appid] === 'undefined') {
		
		Bots[appid]             = new WebSocket(connection.url);
		Bots[appid].isConnected = false;
		Bots[appid].nick        = connection.self.id;
		Bots[appid].team        = connection.team.id;
		Bots[appid].teamDomain  = connection.team.domain;
		Bots[appid].errors      = [];
		Bots[appid].bootedAt    = moment().utc().unix();

		console.log("Undefined");
		console.log("T: " + Object.size(Bots));
	
	//} else if(Bots[appid].connection.connected == false) {
	//	console.log("Defined but not connected!");
	//	Bots[appid].connect();
	} else {
		console.log("Already connected!");
		console.log("T: " + Object.size(Bots));
		return Bots[appid];
	}

	Bots[appid].addListener('open', function () {
		Bots[appid].isConnected = true;
		console.log(appid + " is online");

		setTimeout(function() {
			console.log("Try to send message");
			Bots[appid].send(JSON.stringify({"type":"message","channel":"C02R750V5","text":"I am onnnnn with no user!","ts": Date.now() + ".000000"}));
		}, 8000);
	});

	Bots[appid].addListener('close', function () {
		Bots[appid].isConnected = false;
		console.log("conn closed");
	});

	// Direct message
	Bots[appid].addListener('direct_message', function (message) {
		console.log("Direct message: %j", message);
		console.log("T: " + Object.size(Bots));

		// If command
		if(message.text.indexOf("!") == 0 && message.text.length > 1) {
			var command = message.text.substring(1, message.text.length);
			var from = message.user;

			console.log("It's a command: " + command);

			if(command === "time") {
				self.say(appid, from, "_It's now: *" + moment().utc().format() + "*._");
			} else if(command === "uptime") {
				var time = moment(Bots[appid].bootedAt, "X").utc();
				self.say(appid, from, "_Uptime: *" + time.fromNow() + "* @ *" + time.format() + "*._");
			} else {
				// Command not valid!
				self.say(appid, from, "_Sorry! Couldn't reconize the command: *" + command + "*._");
			}

		} else {
			// Reply
			//self.say(appid, from, "You said: _" + message.text + "_");
		}

	});

	Bots[appid].addListener('message', function (data) {
		var message = JSON.parse(data);

		if(message.type == 'message' && message.channel.indexOf("C") == 0) {

			console.log("Channel message %j", message);
			Bots[appid].emit('channel_message', message);
		
		} else if(message.type == 'message' && message.channel.indexOf("D") == 0) {
		
			console.log("Direct message %j", message);
			Bots[appid].emit('direct_message', message);
		
		} else if(typeof message.type !== 'undefined') {
		
			console.log("Other message %s %j", message.type, message);
			Bots[appid].emit(message.type, message);

		} else {
		
			console.log("Undefined message %j", message);

		}
	});

	Bots[appid].addListener('hello', function () {
		console.log("Slack said HELLO!!!");
	});


	return Bots[appid];

  },

  say: function say(appid, from, to, message) {
  	if(typeof Bots[appid] === 'undefined') {
  		return true;
	}

	var data = {
		"type":    "message",
		"channel": "D02PMQQT2",
		"user":    "U02PMQQSY",
		"text":    message,
		"ts":      Date.now() + ".000000",
		"team":    "T025PLYNL"
	};


	Bots[appid].send(JSON.stringify(data), function(error) {
		console.log("Error!");
	});
  },
  
  disconnect: function disconnect(appid) {

  	if(typeof Bots[appid] === 'undefined') {
  		return true;
	}
	
	Bots[appid].close();
  	Bots[appid] = undefined;

  	return true;
  },

  disconnectAll: function disconnectAll() {
  	
  	for (var appid in Bots) {
	    this.disconnect(appid);
	}

  	return true;
  }

};
