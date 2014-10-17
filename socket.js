// This file is required by app.js.
// It handles all the server-side socketIO logic for CifraChat, interacting
// with the client-side code in /public/js/chat.js.

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

module.exports = function(app, io, slack, models)
{
	var chat = io.of('/chat').on('connection', function(clientSocket)
	{
		// each client is put into a chat room restricted to max 2 clients
		clientSocket.on('joinRoom', function(token, channel, client_signature)
		{
			console.log("Socket JOINROOM CH: " + channel);

		  	models.App.find({ where: { token: token, active: true } }).success(function(application) {

				if(application == null) {
					console.log('Wrong token.');
					
					clientSocket.emit('serverMessage', {
						message: 'Wrong token.'
					});

					// force client to disconnect
					clientSocket.disconnect();
					return;
				}

				var crypto    = require('crypto');
				var signature = crypto.createHmac('sha1', application.slack_api_token).update(channel).digest('hex');
				var appid     = application.id;


				if(signature != client_signature) {
					console.log('Wrong channel signature.');

					clientSocket.emit('serverMessage', {
						message: 'Wrong channel signature.'
					});

					// force client to disconnect
					clientSocket.disconnect();
					return;
				}
				
				var bot = slack.connect(appid, application.slack_xmpp_user, application.slack_xmpp_pass, application.slack_xmpp_host);
				
				// Once connected, set available presence and join room
				bot.on('online', function() {
					console.log("We're online!");
				});

				// client joins room specified in URL
				clientSocket.join(channel);


				// welcome client on succesful connection
				clientSocket.emit('serverMessage', {
					message: 'Welcome to the chat.'
				});

				// let other user know that client joined
				clientSocket.broadcast.to(channel).emit('serverMessage', {
					message: '<b>Other</b> has joined.'
				});

				/*
				if (clients_in_room == MAX_ALLOWED_CLIENTS){
					// let everyone know that the max amount of users (2) has been reached
					chat.in(channel).emit('serverMessage', {
						message: 'This room is now full. There are <b>2</b> users present.'
					});

					console.log("Max users rechead");
				}
				*/

				/** sending unencrypted **/
				clientSocket.on('noncryptSend', function (text) {

					console.log("Connected? " + slack.isConnected(appid));

					if(slack.isConnected(appid) === false) {
						// Let the user know about the error?
						clientSocket.emit('serverMessage', {
							message: '<i>could not deliver the message: <br>' + text.message +  '</i>'
						});

						return;
					}

					// all data sent by client is sent to room
					clientSocket.broadcast.to(channel).emit('noncryptMessage', {
						message: text.message,
						sender: 'Other'
					});
					// and then shown to client
					clientSocket.emit('noncryptMessage', {
						message: text.message,
						sender: 'Self'
					});

					console.log("M: " + text.message)

					// send response
					bot.say('#' + channel, text.message);
				});

				bot.addListener('message#' + channel, function (from, message) {
				    console.log(from + ' => #yourchannel: ' + message);

				    if(from !== application.slack_xmpp_user)
						clientSocket.emit('noncryptMessage', {
							message: message,
							sender: 'Other'
						});
				});

				/*
				// XMPP Response
				bot.on('stanza', function(stanza) {

					console.log("Stanza type: " + stanza.attrs.type + " - " + stanza.attrs.from);


					// always log error stanzas
					if (stanza.attrs.type == 'error') {
						console.log('[error] ' + stanza);

						// Let the user know about the error?
						clientSocket.emit('serverMessage', {
							message: '<i>error sending message</i>'
						});

						return;
					}

					// ignore everything that isn't a room message
					if (!stanza.is('message') || !stanza.attrs.type == 'groupchat') {
						//console.log("ignore everything that isn't a room message");
						//console.log(stanza);
						return;
					}

					// ignore messages we sent
					if (stanza.attrs.from == room_jid(channel) + '/' + room_nick) {
						//console.log("ignore messages we sent");
						//console.log(stanza);
						return;
					}

					var body = stanza.getChild('body');
					// message without body is probably a topic change
					if (!body) {
						//console.log("message without body is probably a topic change");
						//console.log(stanza);
						return;
					}

					var message = body.getText();

					console.log("FROM: " + stanza.attrs.from + " CH: " + channel + " M: " + message);

					
					// Direct message
					if(stanza.attrs.from.indexOf("@" + application.slack_xmpp_host) > -1) {
						console.log("Direct message: " + message);

						// If command
						if(message.indexOf("!") == 0 && message.length > 1) {
							var command = message.substring(1, message.length);

							console.log("It's a command: " + command);

							if(command === "time") {
								var date = new Date();
								bot.send(new xmpp.Element('message', { to: stanza.attrs.from, type: 'chat' }).
									c('body').t("_It's now: *" + date.toLocaleString() + "*._")
								);
							} else {
								// Command not valid!
								bot.send(new xmpp.Element('message', { to: stanza.attrs.from, type: 'chat' }).
									c('body').t("_Sorry! Couldn't reconize the command: *" + command + "*._")
								);
							}

							

						} else {
							// Reply
							bot.send(new xmpp.Element('message', { to: stanza.attrs.from, type: 'chat' }).
								c('body').t("You said: _" + message + "_")
							);
						}

						

					}


					// sp-XXX@conference.HOST.xmpp.slack.com 
					if(stanza.attrs.from.indexOf(room_jid(channel)) > -1)
						clientSocket.emit('noncryptMessage', {
							message: message,
							sender: 'Other'
						});
				});
				*/

				// Error handler
				bot.on('error', function(err) {
					
					// Let the user know about the error?
					clientSocket.emit('serverMessage', {
						message: '<i>error connecting to support.</i>'
					});
				});
			

				// Disconnect handler
				bot.on('disconnect', function(e) {
					// Let the user know about the error?
					clientSocket.emit('serverMessage', {
						message: '<i>support is now offline.</i>'
					});

				});

				/** disconnect listener **/
				// notify others that somebody left the chat
				clientSocket.on('disconnect', function() {
					bot.say('#' + channel, "_User disconnected!_");
				});
			}); 
		}); // end joinRoom listener
	});
};
