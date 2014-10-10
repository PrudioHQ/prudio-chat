// This file is required by app.js.
// It handles all the server-side socketIO logic for CifraChat, interacting
// with the client-side code in /public/js/chat.js.

// discussion: https://github.com/Automattic/socket.io/issues/1450
var roomCount = function(room)
{
	var localCount = 0;
	if (room)
		for (var id in room)
			localCount ++;
	return localCount;
}

// messages must be numbered to notify each client when their message is decrypted
var messageNum = 1;
var MAX_ALLOWED_CLIENTS = 1;


module.exports = function(app, io, xmpp, models)
{

	var chat = io.of('/chat').on('connection', function(clntSocket)
	{
		// each client is put into a chat room restricted to max 2 clients
		clntSocket.on('joinRoom', function(token, channel, client_signature)
		{
		  	models.App.find({ where: { token: token, active: true } }).success(function(application) {

				if(application == null) {
					console.log('Wrong token.');
					
					clntSocket.emit('serverMessage', {
						message: 'Wrong token.'
					});

					// force client to disconnect
					clntSocket.disconnect();
					return;
				}

				var jid = "helder@sto.xmpp.slack.com"
				var password = "sto.OxppPSmAdr8nzxg631nH"
				//var room_jid = "169186_test@conf.hipchat.com"
				var room_nick = "helder"
				var room_jid = function(name) {
					return name + "@conference.sto.xmpp.slack.com";
				}

				var cl = new xmpp.Client({
				  jid: jid + '/bot',
				  password: password
				});

				var crypto = require('crypto');
				var signature = crypto.createHmac('sha1', application.slack_api_token).update(channel).digest('hex');

				if(signature != client_signature) {
					console.log('Wrong channel signature.');

					clntSocket.emit('serverMessage', {
						message: 'Wrong channel signature.'
					});

					// force client to disconnect
					clntSocket.disconnect();
					return;
				}

			  	var clients_in_room = roomCount(chat.adapter.rooms[channel]);
				// client may only join room only if it's not full
				if (clients_in_room >= MAX_ALLOWED_CLIENTS)
				{
					console.log('This room is full.');

					clntSocket.emit('serverMessage', {
						message: 'This room is full.'
					});
					// force client to disconnect
					clntSocket.disconnect();
					return;
				}
				
				
				console.log("Cool! " + application.name);
				console.log("Connected");
				
				// Once connected, set available presence and join room
				cl.on('online', function() {
					console.log("We're online!");

					// set ourselves as online
					cl.send(new xmpp.Element('presence', { type: 'available' }).
						c('show').t('chat')
					);

					// join room (and request no chat history)
					cl.send(new xmpp.Element('presence', { to: room_jid(channel) + '/' + room_nick }).
						c('x', { xmlns: 'http://jabber.org/protocol/muc' })
					);

					// Change Topic
					//cl.send(new xmpp.Element('message', { to: room_jid(channel) + '/' + room_nick, type: 'groupchat' }).
					//	c('subject').t('Room ' + channel)
					//);

					// send keepalive data or server will disconnect us after 150s of inactivity
					setInterval(function() {
						cl.send(' ');
					}, 30000);

					console.log("We're online!");

				});

				// client joins room specified in URL
				clntSocket.join(channel);

				console.log("Room: " + channel);

				clients_in_room++;

				// welcome client on succesful connection
				clntSocket.emit('serverMessage', {
					message: 'Welcome to the chat.'
				});

				// let other user know that client joined
				clntSocket.broadcast.to(channel).emit('serverMessage', {
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
				clntSocket.on('noncryptSend', function (text) {


					// all data sent by client is sent to room
					clntSocket.broadcast.to(channel).emit('noncryptMessage', {
						message: text.message,
						sender: 'Other'
					});
					// and then shown to client
					clntSocket.emit('noncryptMessage', {
						message: text.message,
						sender: 'Self'
					});

					console.log("M: " + text.message)

					// send response
					cl.send(new xmpp.Element('message', { to: room_jid(channel) + '/' + room_nick, type: 'groupchat' }).
						c('body').t(text.message)
					);

					// unencrypted messages don't increment messageNum because messageNum is only used to identify which message was decrypted
				});

				// XMPP Response
				cl.on('stanza', function(stanza) {
					// always log error stanzas
					if (stanza.attrs.type == 'error') {
						console.log('[error] ' + stanza);
						return;
					}

					// ignore everything that isn't a room message
					if (!stanza.is('message') || !stanza.attrs.type == 'groupchat') {
						console.log("ignore everything that isn't a room message");
						//console.log(stanza);
						return;
					}

					// ignore messages we sent
					if (stanza.attrs.from == room_jid(channel) + '/' + room_nick) {
						console.log("ignore messages we sent");
						//console.log(stanza);
						return;
					}

					var body = stanza.getChild('body');
					// message without body is probably a topic change
					if (!body) {
						console.log("message without body is probably a topic change");
						//console.log(stanza);
						return;
					}
					var message = body.getText();

					console.log("CH: " + channel + " M: " + message);


					clntSocket.emit('noncryptMessage', {
						message: message,
						sender: 'Other'
					});
				});

				// Errror handler
				cl.on('error', function(err) {
					console.log("Error in XMPP");
					console.log(err);
				});
			

				/** disconnect listener **/
				// notify others that somebody left the chat
				clntSocket.on('disconnect', function() {
					// let room know that this client has left
					clntSocket.broadcast.to(channel).emit('serverMessage', {
							message: '<b>Other</b> has left.'
					});
				});
			}); 
		}); // end joinRoom listener
	});
};
