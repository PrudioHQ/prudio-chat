var WebSocket = require('ws');
var emitter   = require('./utils/emitter');
var moment    = require('moment');
var request   = require('request'); // github.com/mikeal/request

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

Object.getKeyByValue = function( obj, value ) {
    for( var prop in obj ) {
        if( obj.hasOwnProperty( prop ) ) {
        	console.log("PROP " + prop)
             if( obj[ prop ] === value )
                 return prop;
        }
    }
};

// Public
var self = module.exports = {

	size: function size() {
		return Object.size(Bots);
	},

	onlineUsers: function onlineUsers(appid) {

		if(typeof Bots[appid] === 'undefined')
			return false;

		var application = Bots[appid].application;

		request.post('https://slack.com/api/users.list', { json: true, form: { token: application.slack_api_token }}, function (error, response, body) {
			if (!error && response.statusCode == 200 && typeof body.ok !== "undefined" && body.ok == true) {
				return body.members;
			} else {
				return error;
			}
		});
	},

	addChannel: function addChannel(appid, code, name) {
		if(typeof Bots[appid] === 'undefined')
			return false;

		Bots[appid].channels["#" + name] = code;

		return Bots[appid].channels;
	},

	getChannelCode: function getChannelCode(appid, name) {
		if(typeof Bots[appid] === 'undefined')
			return false;

		return Bots[appid].channels["#" + name];
	},

	isConnected: function isConnected(appid) {
		if(typeof Bots[appid] === 'undefined')
			return false;
		return Bots[appid].isConnected;
	},

	connect: function connect(application) {

		var appid = application.id;

		console.log("Connecting to " + appid);

		if(typeof Bots[appid] === 'undefined' || Bots[appid].isConnected == false) {

			request.post('https://slack.com/api/rtm.start', { json: true, form: { token: application.slack_api_token, t: Date.now() }}, function (error, response, connection) {
				if (!error && response.statusCode == 200 && typeof connection.ok !== "undefined" && connection.ok == true) {
								
					Bots[appid]             = emitter;
					Bots[appid].websocket   = new WebSocket(connection.url);
					Bots[appid].application = application;
					Bots[appid].isConnected = false;
					Bots[appid].msgCount    = 0;
					Bots[appid].nick        = connection.self.id;
					Bots[appid].team        = connection.team.id;
					Bots[appid].teamDomain  = connection.team.domain;
					Bots[appid].bootedAt    = moment().utc().unix();
					Bots[appid].channels    = [];
					Bots[appid].errors      = [];


					console.log("Undefined");
					console.log("T: " + Object.size(Bots));

					// Read Channels 
					for (var channel in connection.channels) {
						self.addChannel(appid, connection.channels[channel].id, connection.channels[channel].name);
					}

					// Socket Listner
					Bots[appid].websocket.addListener('open', function () {
						console.log(appid + " is now open");
					});

					Bots[appid].addListener('hello', function () {
						console.log(appid + " said hello");
						Bots[appid].isConnected = true;
						self.say(appid, self.getChannelCode(appid, "general"), "I'm online!");
					});

					Bots[appid].websocket.addListener('close', function () {
						Bots[appid].isConnected = false;
						Bots[appid].removeAllListeners();
						console.log("conn closed");
					});

					// Websocket Events 
					Bots[appid].websocket.addListener('message', function (data) {
						var message = JSON.parse(data);

						// Gambiarra
						Bots[appid].msgCount++
						// Ignore the 2 message (last message)
						if(Bots[appid].msgCount == 2) return;

						if(message.type == 'message' && message.channel.indexOf("C") == 0) {

							console.log("Channel message %j", message);
							Bots[appid].emit('message', message);
						
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

					Bots[appid].addListener('error', function (e) {
						console.log(appid + " had an error");
					});

					// Direct message
					Bots[appid].addListener('direct_message', function (message) {

						// If command
						if(message.text.indexOf("!") == 0 && message.text.length > 1) {
							var command = message.text.substring(1, message.text.length);

							console.log("It's a command: " + command);

							if(command === "time") {
								self.say(appid, message.channel, "_It's now: *" + moment().utc().format() + "*._");
							} else if(command === "uptime") {
								var time = moment(Bots[appid].bootedAt, "X").utc();
								self.say(appid, message.channel, "_Uptime: *" + time.fromNow() + "* @ *" + time.format() + "*._");
							} else {
								// Command not valid!
								self.say(appid, message.channel, "_Sorry! Couldn't reconize the command: *" + command + "*._");
							}

						} else {
							// Reply
							self.say(appid, message.channel, "You said: _" + message.text + "_");
						}

					});

					return Bots[appid];
				} 
			});

		} else {
			console.log("Already connected!");
			console.log("T: " + Object.size(Bots));

			return Bots[appid];
		}


	},

	say: function say(appid, channel, message) {
		if(typeof Bots[appid] === 'undefined') {
			return true;
		}

		var data = {
			"type":    "message",
			"channel": channel, //D... or C....
			"user":    Bots[appid].nick,
			"text":    message,
			"ts":      Date.now() + ".000000",
			"team":    Bots[appid].team
		};

		Bots[appid].websocket.send(JSON.stringify(data), function(error) {
			console.log("Error sending data to socket!");
		});
	},

	// Disconect one websocket
	disconnect: function disconnect(appid) {

		if(typeof Bots[appid] === 'undefined') {
			return true;
		}

		if(Bots[appid].isConnected == true) {
			self.say(appid, self.getChannelCode(appid, "general"), "I'm going offline!");
			Bots[appid].websocket.close();
		}
		
		return true;
	},

	// Disconect all webockets
	disconnectAll: function disconnectAll() {
		
		for (var appid in Bots) {
			this.disconnect(appid);
		}

		return true;
	}
};
