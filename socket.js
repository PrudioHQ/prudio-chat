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

module.exports = function(app, io, xmpp, xmppBots, models)
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
				

				var jid       = application.slack_xmpp_user + "@" + application.slack_xmpp_host + '/' + application.slack_xmpp_user;
				var password  = application.slack_xmpp_pass; //"sto.OxppPSmAdr8nzxg631nH"
				var room_nick = application.slack_xmpp_user; // "helder"

				var room_jid = function(name) {
					return name + "@conference." + application.slack_xmpp_host; //sto.xmpp.slack.com";
				}

				if(typeof xmppBots[appid] === 'undefined') {
					console.log("Undefined");
					
					xmppBots[appid] = new xmpp.Client({
					  jid:       jid,
					  password:  password,
					  reconnect: true
					});

					console.log("T: " + Object.size(xmppBots));
				
				} else if(xmppBots[appid].connection.connected == false) {
					console.log("Defined but not connected!");
					xmppBots[appid].connect();
				} else {
					console.log("Connected!");
				}
					
				
				console.log("Cool! " + application.name);
				console.log("Connected");
				
				// Once connected, set available presence and join room
				xmppBots[appid].on('online', function() {
					console.log("We're online!");

					// set ourselves as online
					xmppBots[appid].send(new xmpp.Element('presence', { type: 'available' }).
						c('show').t('chat')
					);

					// join room (and request no chat history)
					xmppBots[appid].send(new xmpp.Element('presence', { to: room_jid(channel) + '/' + room_nick }).
						c('x', { xmlns: 'http://jabber.org/protocol/muc' })
					);

					// Change Topic
					//xmppBots[appid].send(new xmpp.Element('message', { to: room_jid(channel) + '/' + room_nick, type: 'groupchat' }).
					//	c('subject').t('Room ' + channel)
					//);

					// send keepalive data or server will disconnect us after 150s of inactivity
					setInterval(function() {
						xmppBots[appid].send(' ');
					}, 30000);
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

					console.log("Connected? " + xmppBots[appid].connection.connected);

					if(xmppBots[appid].connection.connected == false) {
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
					xmppBots[appid].send(new xmpp.Element('message', { to: room_jid(channel) + '/' + room_nick, type: 'groupchat' }).
						c('body').t(text.message)
					);

					// unencrypted messages don't increment messageNum because messageNum is only used to identify which message was decrypted
				});

				// XMPP Response
				xmppBots[appid].on('stanza', function(stanza) {

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
								xmppBots[appid].send(new xmpp.Element('message', { to: stanza.attrs.from, type: 'chat' }).
									c('body').t("_It's now: *" + date.toLocaleString() + "*._")
								);
							} else {
								// Command not valid!
								xmppBots[appid].send(new xmpp.Element('message', { to: stanza.attrs.from, type: 'chat' }).
									c('body').t("_Sorry! Couldn't reconize the command: *" + command + "*._")
								);
							}

							

						} else {
							// Reply
							xmppBots[appid].send(new xmpp.Element('message', { to: stanza.attrs.from, type: 'chat' }).
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

				// Error handler
				xmppBots[appid].on('error', function(err) {
					console.log("Error in XMPP");
					console.log(err);

					// Let the user know about the error?
					clientSocket.emit('serverMessage', {
						message: '<i>error connecting to support.</i>'
					});
				});
			

				// Disconnect handler
				xmppBots[appid].on('disconnect', function(e) {
					console.log("Disconnected XMPP");
					console.log(e);
					// Let the user know about the error?
					clientSocket.emit('serverMessage', {
						message: '<i>support is now offline.</i>'
					});

				});

				/** disconnect listener **/
				// notify others that somebody left the chat
				clientSocket.on('disconnect', function() {
					// let room know that this client has left
					/*clientSocket.broadcast.to(channel).emit('serverMessage', {
							message: '<b>Other</b> has left.'
					});*/

					// Send to slack!
					xmppBots[appid].send(new xmpp.Element('message', { to: room_jid(channel) + '/' + room_nick, type: 'groupchat' }).
						c('body').t("_User disconnected!_")
					);

				});
			}); 
		}); // end joinRoom listener
	});
};
