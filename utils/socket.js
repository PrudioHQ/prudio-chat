module.exports = function(app, io, slack, App, emoji)
{
	io.of('/chat').on('connection', function(clientSocket)
	{
		// each client is put into a chat room restricted to max 2 clients
		clientSocket.on('joinRoom', function(appId, channel, clientSignature)
		{
		  	App.findOne({ appId: appId, active: true }, function(err, application) {
				if (err) {
					console.error(err);
				}

				if(application === null) {
					console.error('Wrong appId.');

					clientSocket.emit('serverMessage', {
						message: 'Wrong appId.'
					});

					// force client to disconnect
					clientSocket.disconnect();
					return;
				}

				var crypto      = require('crypto');
				var appId       = application.appId;
				var signature   = crypto.createHmac('sha1', application.slackApiToken).update(channel.concat(appId)).digest('hex');

				if(signature !== clientSignature) {
					console.log('Wrong signature.');

					clientSocket.emit('serverMessage', {
						message: 'Wrong signature.'
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

					if(slack.isConnected(appId) === false) {
						// Let the user know about the error?
						clientSocket.emit('serverMessage', {
							message: 'Could not deliver the message: ' + text.message
						});

						return;
					}

					// all data sent by client is sent to room
					// clientSocket.broadcast.to(channel).emit('message', {
					// 	message: text.message,
					// 	sender: 'Other'
					// });

					// and then shown to client
					clientSocket.emit('message', {
						message: text.message,
						sender: 'Self'
					});

					// send response to slack
					slack.say(appId, channel, text.message);
				});

				console.log("Type: " + typeof bot);
				if (typeof bot === "undefined") {
					console.error("Bot is undefined!");

					clientSocket.emit('serverMessage', {
						message: 'Still connecting'
					});

					return;
				}

				// On Slack message, redirect to socket
				bot.on('message', function (message) {
				    console.log('Message from the socket: %j', message);

				    if(message.channel === channel) {
				    	clientSocket.emit('message', {
							message: emoji.parse(message.text, "//prudio-chat.herokuapp.com/emojis"),
							sender: 'Other'
						});
					}
				});

				bot.on('user_typing', function (message) {
				    console.log('User typing from the socket: %j', message);

				    if(message.channel === channel) {
				    	clientSocket.emit('typingMessage');
				    }
				});

				// Error handler
				bot.on('error', function(err) {
					console.error("Error message: %j", err);
					console.log("Channel: %j", channel);
					// Let the user know about the error?
					clientSocket.emit('serverMessage', {
						message: 'Message could not be delivered.'
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
					slack.say(appId, channel, "_User disconnected!_");
				});

			});
		});
	});
};
