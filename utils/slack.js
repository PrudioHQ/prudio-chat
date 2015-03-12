var WebSocket = require('ws');
var events    = require('events');
var moment    = require('moment');
var fs        = require('fs');
var request   = require('request'); // github.com/mikeal/request
var loki      = require('lokijs');

var db        = new loki();

// Private
var Bots  = {};
//var Apps = db.addCollection('Apps');
var Users = db.addCollection('Users');
var Channels = db.addCollection('Channels');

// Size of an object
Object.size = function(obj) {
    var size = 0;
    var key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            size++;
        }
    }
    return size;
};

// Public
var self = module.exports = {

    size: function size() {
        return Object.size(Bots);
    },

    onlineUsers: function onlineUsers(appid) {

        var users = Users.where(function(obj) {
            return obj.appid === appid &&
            obj.user.presence === 'active' &&
            obj.user.id !== 'USLACKBOT' &&
            obj.user.is_bot === false &&
            obj.user.deleted === false;
        });

        return users;
    },

    addChannels: function addChannels(appid, channels) {

        for (var channel in channels) {
            if (channels.hasOwnProperty(channel)) {
                Channels.insert({ appid: appid, channel: channels[channel]});
            }
        }

        return Channels;
    },

    addUsers: function addUsers(appid, users) {

        for (var user in users) {
            if (users.hasOwnProperty(user)) {
                Users.insert({ appid: appid, user: users[user]});
            }
        }

        return Users;
    },

    getChannelCode: function getChannelCode(appid, name) {

        var channel = Channels.where(function(obj) {
            return obj.appid === appid && obj.channel.name === name;
        });

        if (channel !== null && channel.length === 1) {
            return channel[0].channel.id;
        } else {
            return false;
        }
    },

    isConnected: function isConnected(appid) {
        if (typeof Bots[appid] === 'undefined') {
            return false;
        }

        return Bots[appid].isConnected;
    },

    connect: function connect(application) {

        var appid = application.appId;

        console.log('Connecting to ' + appid);

        if (typeof Bots[appid] === 'undefined' || Bots[appid].isConnected === false) {

            request.post('https://slack.com/api/rtm.start',
                {
                    json: true,
                    form: {
                        token: application.slackBotToken,
                        t: Date.now()
                    }
                },
                function(error, response, connection) {

                if (!error && response.statusCode === 200 && typeof connection.ok !== 'undefined' && connection.ok === true) {

                    Bots[appid]             = new events.EventEmitter();
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

                    console.log('T: ' + Object.size(Bots));

                    // Read Channels
                    self.addChannels(appid, connection.channels);

                    // Add Users to DB
                    self.addUsers(appid, connection.users);

                    // Socket Listner
                    Bots[appid].websocket.addListener('open', function() {
                        console.log(appid + ' is now open');
                    });

                    Bots[appid].addListener('hello', function() {
                        console.log(appid + ' said hello');
                        Bots[appid].isConnected = true;
                        //self.say(appid, self.getChannelCode(appid, 'general'), 'I\'m online!');
                    });

                    Bots[appid].websocket.addListener('close', function() {
                        Bots[appid].isConnected = false;
                        Bots[appid].removeAllListeners();
                        console.log('conn closed');
                    });

                    // Websocket Events
                    Bots[appid].websocket.addListener('message', function(data) {
                        var message = JSON.parse(data);

                        // Gambiarra
                        Bots[appid].msgCount++
                        // Ignore the 2 message (last message)
                        if (Bots[appid].msgCount === 2) {
                            return;
                        }

                        if (message.type === 'message' && message.channel.indexOf('C') === 0 && typeof message.subtype === 'undefined') {

                            console.log('Channel message %j', message);
                            Bots[appid].emit('message', message);

                        } else if (message.type === 'message' && message.channel.indexOf('C') === 0 && message.subtype === 'file_share') {

                            console.log('File shared %j', message);
                            var sharedMessage = {text: 'Shared a file: ' + message.file.url , channel: message.channel}
                            Bots[appid].emit('message', sharedMessage);

                        } else if (message.type === 'message' && message.channel.indexOf('D') === 0) {

                            console.log('Direct message %j', message);
                            Bots[appid].emit('direct_message', message);

                        } else if (message.type === 'file_public') {

                            console.log('File public shared  %j', message);
                            //Bots[appid].emit('message', message);

                        } else if (message.type === 'file_shared') {

                            console.log('File shared  %j', message);
                            //Bots[appid].emit('message', message);

                        } else if (message.type === 'presence_change') {

                            console.log('Presence changed %s %j', message.type, message);

                            var usr = Users.where(function(usr) { return usr.appid === appid && usr.user.id === message.user; })

                            if (usr !== null && usr.length === 1) {
                                usr = usr[0];
                                usr.user.presence = message.presence;
                                Users.update(usr);
                            }

                        } else if (typeof message.type !== 'undefined' && message.type !== 'message') {

                            console.log('Other message %s %j', message.type, message);
                            Bots[appid].emit(message.type, message);

                        } else {
                            console.log('Undefined message %j', message);
                        }
                    });

                    Bots[appid].addListener('error', function(e) {
                        console.error(appid + ' had an error');
                    });

                    // Direct message
                    Bots[appid].addListener('direct_message', function(message) {

                        // If command
                        if (message.text.indexOf('!') === 0 && message.text.length > 1) {
                            var command = message.text.substring(1, message.text.length);

                            console.log('It\'s a command: ' + command);

                            if (command === 'time') {
                                self.say(appid, message.channel, '_It\'s now: *' + moment().utc().format() + '*._');
                            } else if (command === 'uptime') {
                                var time = moment(Bots[appid].bootedAt, 'X').utc();
                                self.say(appid, message.channel, '_Uptime: *' + time.fromNow() + '* @ *' + time.format() + '*._');
                            } else {
                                // Command not valid!
                                self.say(appid, message.channel, '_Sorry! Couldn\'t reconize the command: *' + command + '*._');
                            }

                        } else {
                            // Reply
                            self.say(appid, message.channel, 'You said: _' + message.text + '_');
                        }

                    });

                    return Bots[appid];
                }
            });

        } else {
            console.log('Already connected!');
            console.log('T: ' + Object.size(Bots));

            return Bots[appid];
        }
    },

    say: function say(appid, channel, message) {

        if (typeof Bots[appid] === 'undefined') {
            return true;
        }

        var data = {
            "type":    "message",
            "channel": channel, //D... or C....
            "user":    Bots[appid].nick,
            "text":    message,
            "ts":      Date.now() + '.000000',
            "team":    Bots[appid].team
        };

        Bots[appid].websocket.send(JSON.stringify(data), function(error) {
            if (error) {
                console.error('Error sending data to socket!', error);
                console.log(data);
            }
        });
    },

    // Recover History
    history: function history(application, channel, callback) {

        var formData = {
            // Pass Slack token
            token: application.slackApiToken,
            // Pass Slack channel
            channel: channel,
            // Number of messages to return (max: 100)
            count: 50
        };

        // Sending the request
        request.post(
            'https://slack.com/api/channels.history',
            {
                json: true,
                formData: formData
            },

            function(error, response, body) {
                if (!error && response.statusCode === 200 && typeof body.ok !== 'undefined' && body.ok === true) {
                    return callback(null, body, application);
                } else {
                    return callback("Error fetching history");
                }
            });
    },

    // Upload a file
    uploadFile: function uploadFile(applicationToken, channel, stream) {

        var formData = {
            // Pass Slack token
            token: applicationToken,
            // Pass Slack channel
            channels: channel,
            // Pass data via file stream
            file: {
                value:  fs.createReadStream(stream.file.path),
                options: {
                    filename: stream.file.name,
                    contentType: stream.file.type
                }
            }
        };

        // Sending the request
        request.post(
            'https://slack.com/api/files.upload',
            {
                'content-type': 'multipart\/form-data',
                formData: formData
            }, function(error, response, body) {

            if (!error && response.statusCode === 200 && typeof body.ok !== 'undefined' && body.ok === true) {
                console.log('File (' + stream.file.name + ') Uploaded');
            } else {
                console.log('File (' + stream.file.name + ') Not Uploaded');
            }
        });

    },

    // Disconect one websocket
    disconnect: function disconnect(appid) {

        if (typeof Bots[appid] === 'undefined') {
            return true;
        }

        if (Bots[appid].isConnected === true) {
            self.say(appid, self.getChannelCode(appid, 'general'), 'I\'m going offline!');
            Bots[appid].websocket.close();
        }

        return true;
    },

    // Disconect all webockets
    disconnectAll: function disconnectAll() {

        for (var appid in Bots) {
            if (Bots.hasOwnProperty(appid)) {
                this.disconnect(appid);
            }
        }

        return true;
    }
};
