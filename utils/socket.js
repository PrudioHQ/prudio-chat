module.exports = function(app, io, slack, models, emoji)
{
	var chat = io.of('/chat').on('connection', function(clientSocket)
	{
		// each client is put into a chat room restricted to max 2 clients
		clientSocket.on('joinRoom', function(appid, channel, client_signature)
		{
			console.log("Socket JOINROOM CH: " + channel);

		  	models.app.find({ where: { appid: appid, active: true } }).success(function(application) {

				if(application == null) {
					console.log('Wrong appid.');
					
					clientSocket.emit('serverMessage', {
						message: 'Wrong appid.'
					});

					// force client to disconnect
					clientSocket.disconnect();
					return;
				}

				var crypto      = require('crypto');
				var signature   = crypto.createHmac('sha1', application.slack_api_token).update(channel).digest('hex');
				var appid       = application.id;

				if(signature != client_signature) {
					console.log('Wrong channel signature.');

					clientSocket.emit('serverMessage', {
						message: 'Wrong channel signature.'
					});

					// force client to disconnect
					clientSocket.disconnect();
					return;
				}
				
				var bot = slack.connect(application);
				
				// client joins room specified in URL
				clientSocket.join(channel);

				// welcome client on succesful connection
				clientSocket.emit('serverMessage', {
					message: 'Welcome to the chat.'
				});

				/** sendMessage **/
				clientSocket.on('sendMessage', function (text) {

					if(slack.isConnected(appid) === false) {
						// Let the user know about the error?
						clientSocket.emit('serverMessage', {
							message: 'Could not deliver the message: ' + text.message
						});

						return;
					}

					// all data sent by client is sent to room
					clientSocket.broadcast.to(channel).emit('message', {
						message: text.message,
						sender: 'Other'
					});

					// and then shown to client
					clientSocket.emit('message', {
						message: text.message,
						sender: 'Self'
					});

					// send response to slack
					slack.say(appid, channel, text.message);
				});

				console.log("Type: " + typeof bot);

				// On Slack message, redirect to socket
				bot.on('message', function (message) {
				    console.log('Message from the socket: %j', message);

				    if(message.channel == channel)
				    	clientSocket.emit('message', {
							message: emoji.parse(message.text, "//chat.prud.io/emojis"),
							sender: 'Other'
						});
				});

				bot.on('user_typing', function (message) {
				    console.log('User typing from the socket: %j', message);

				    if(message.channel == channel)
				    	clientSocket.emit('typingMessage');
				});

				// Error handler
				bot.on('error', function(err) {
					console.log("Error message: %j", err);
					// Let the user know about the error?
					clientSocket.emit('serverMessage', {
						message: 'Error connecting to support.'
					});
				});
		
				// Slack disconnect handler (should not happen often).
				bot.on('disconnect', function(e) {
					// Let the user know about the error?
					clientSocket.emit('serverMessage', {
						message: 'Support is offline.'
					});

				});

				// Socket disconnect listener, notify Slack that user left the chat
				clientSocket.on('disconnect', function() {
					slack.say(appid, channel, "_User disconnected!_");
				});

			}); 
		});
	});
};