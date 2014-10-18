var emitter = require('./emitter');
var irc     = require('irc');
var moment  = require('moment');

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
  
  connect: function connect(appid, user, pass, host) {
    console.log("Connecting to " + appid);

	if(typeof Bots[appid] === 'undefined') {
		
		Bots[appid] = new irc.Client(host, user, { // 'sto.irc.slack.com', 'bot'
			secure: true,
			debug: false,
			sasl: true, 
			username: user, // bot
			password: pass, // "sto.xt9rBQ3kmwcS4XlQ7Z0A",
			showErrors: true,
			retryDelay: 1000,
            retryCount: 3,
			channels: [],
		});

		Bots[appid].isConnected = false;
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

	Bots[appid].addListener('connect', function () {
		Bots[appid].isConnected = true;
		console.log(appid + " is online");
	});

	Bots[appid].addListener('error', function (e) {
		Bots[appid].isConnected = false;
		Bots[appid].erros.push(e);

		console.log("error");
		console.log(e);
	});

	// Direct message
	Bots[appid].addListener('pm', function (from, message) {
		console.log("Direct message: " + message);
		console.log("T: "              + Object.size(Bots));

		// If command
		if(message.indexOf("!") == 0 && message.length > 1) {
			var command = message.substring(1, message.length);

			console.log("It's a command: " + command);

			if(command === "time") {
				Bots[appid].say(from, "_It's now: *" + moment().utc().format() + "*._");
			} else if(command === "uptime") {
				var time = moment(Bots[appid].bootedAt, "X").utc();
				Bots[appid].say(from, "_Uptime: *" + time.fromNow() + "* @ *" + time.format() + "*._");
			} else {
				// Command not valid!
				Bots[appid].say(from, "_Sorry! Couldn't reconize the command: *" + command + "*._");
			}

		} else {
			// Reply
			Bots[appid].say(from, "You said: _" + message + "_");
		}

	});

	return Bots[appid];

  },
  
  disconnect: function disconnect(appid) {
  	if(typeof Bots[appid] === 'undefined') {
  		return true;
	}
	
	Bots[appid].disconnect();
  	Bots[appid] = undefined;

  	return true;
  },
  
  emitMethod: function emitMethod() {
  	emitter.emit('emittedevent', x++);
  }


};

emitter.on('emittedevent', function(x) {
	console.log('We have got: ' + x);
});
/*
(function () {

    var xmppList = new EventEmitter();

	var x = 1;

	xmppList.emitMethod = function() {
		this.
	}

	xmppList.on('emittedevent', function(x) {
	  console.log('We have got: ' + x);
	});


	module.exports = xmppList;

}());
*/