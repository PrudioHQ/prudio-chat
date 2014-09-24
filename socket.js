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


module.exports = function(app, io, xmpp, hipchat)
{
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

	var chat = io.of('/chat').on('connection', function(clntSocket)
	{
	  // each client is put into a chat room restricted to max 2 clients
	  clntSocket.on('joinRoom', function(room_id)
	  {
	  	var clients_in_room = roomCount(chat.adapter.rooms[room_id]);
		// client may only join room only if it's not full
		if (clients_in_room >= MAX_ALLOWED_CLIENTS)
		{
			clntSocket.emit('serverMessage', {
				message: 'This room is full.'
			});
			// force client to disconnect
			clntSocket.disconnect();
		}
		else
		{
			/*var hc = new hipchat('iS4ODj9ZG7wYh2PVhNSchriVoNkXzBmOHIN5j0wQ');

			hc.create_room({name: 'SP-' + room_id}, function(err, room){
				if(!err)
					hc.invite_member({name: 'SP-' + room_id, user_email: 'cossou@gmail.com'}, 'Support Request', function(err, data){
						console.log("D: " + data);
						console.log("E: " + err);
					})
			});
			*/

			console.log("Connected");
			// Once connected, set available presence and join room
			cl.on('online', function() {
				console.log("We're online!");

				// set ourselves as online
				cl.send(new xmpp.Element('presence', { type: 'available' }).
					c('show').t('chat')
				);

				// join room (and request no chat history)
				cl.send(new xmpp.Element('presence', { to: room_jid(room_id) + '/' + room_nick }).
					c('x', { xmlns: 'http://jabber.org/protocol/muc' })
				);

				// Change Topic
				//cl.send(new xmpp.Element('message', { to: room_jid(room_id) + '/' + room_nick, type: 'groupchat' }).
				//	c('subject').t('Room ' + room_id)
				//);

				// send keepalive data or server will disconnect us after 150s of inactivity
				setInterval(function() {
					cl.send(' ');
				}, 30000);

				console.log("We're online!");

			});

			// client joins room specified in URL
			clntSocket.join(room_id);

			console.log("Room: " + room_id);

			clients_in_room++;

			// welcome client on succesful connection
			clntSocket.emit('serverMessage', {
				message: 'Welcome to  CifraChat. Send someone a link to this room to start chatting. Max 2 people per room.'
			});

			// let other user know that client joined
			clntSocket.broadcast.to(room_id).emit('serverMessage', {
				message: '<b>Other</b> has joined.'
			});

			if (clients_in_room == MAX_ALLOWED_CLIENTS){
				// let everyone know that the max amount of users (2) has been reached
				chat.in(room_id).emit('serverMessage', {
					message: 'This room is now full. There are <b>2</b> users present.'
				});

				console.log("Max users rechead");
			}

		    /** sending encrypted
			clntSocket.on('cryptSend', function (data) {
				// all data sent by client is sent to room
				clntSocket.broadcast.to(room_id).emit('cryptMessage', {
					message: data.message,
					hint: data.hint,
					sender: 'Other',
					number: messageNum
				});
				// and then shown to client
				clntSocket.emit('cryptMessage', {
					message: data.message,
					hint: data.hint,
					sender: 'Self',
					number: messageNum
				});

				messageNum++;
			});
			**/

			/** sending unencrypted **/
			clntSocket.on('noncryptSend', function (text) {


				// all data sent by client is sent to room
				clntSocket.broadcast.to(room_id).emit('noncryptMessage', {
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
				cl.send(new xmpp.Element('message', { to: room_jid(room_id) + '/' + room_nick, type: 'groupchat' }).
					c('body').t(text.message)
				);

				// unencrypted messages don't increment messageNum because messageNum is only used to identify which message was decrypted
			});

			/** notifying clients of decryption
			clntSocket.on('confirmDecrypt', function(id) {
				// let room know which particular message was decrypted
				chat.in(room_id).emit('markDecryption', id);
			});

			clntSocket.on('confirmMessageDestroy', function(id) {
				chat.in(room_id).emit('markMessageDestroy', id)
			});
			**/

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
					console.log(stanza);
					return;
				}

				// ignore messages we sent
				if (stanza.attrs.from == room_jid(room_id) + '/' + room_nick) {
					console.log("ignore messages we sent");
					console.log(stanza);
					return;
				}

				var body = stanza.getChild('body');
				// message without body is probably a topic change
				if (!body) {
					console.log("message without body is probably a topic change");
					console.log(stanza);
					return;
				}
				var message = body.getText();

				console.log("M: " + message);


				clntSocket.broadcast.to(room_id).emit('noncryptMessage', {
					message: message,
					sender: 'Other'
				});
			});
		};

		/** disconnect listener **/
		// notify others that somebody left the chat
		clntSocket.on('disconnect', function() {
			// let room know that this client has left
			clntSocket.broadcast.to(room_id).emit('serverMessage', {
					message: '<b>Other</b> has left.'
				});
		});
	  }); // end joinRoom listener
	});
};
