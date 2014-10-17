
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
							message: '<i>could not deliver the message: <br>' + text.message +  '</i>'
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
					bot.say('#' + channel, text.message);
				});

				// On Slack message, redirect to socket
				bot.addListener('message#' + channel, function (from, message) {
				    console.log(from + ' => #yourchannel: ' + message);

				    // If the message is not from the bot
				    if(from !== application.slack_xmpp_user)
						clientSocket.emit('message', {
							message: message,
							sender: 'Other'
						});
				});

				// Error handler
				bot.on('error', function(err) {
					// Let the user know about the error?
					clientSocket.emit('serverMessage', {
						message: '<i>error connecting to support.</i>'
					});
				});
		
				// Slack disconnect handler (should not happen often).
				bot.on('disconnect', function(e) {
					// Let the user know about the error?
					clientSocket.emit('serverMessage', {
						message: '<i>support is now offline.</i>'
					});

				});

				// Socket disconnect listener, notify Slack that user left the chat
				clientSocket.on('disconnect', function() {
					bot.say('#' + channel, "_User disconnected!_");
				});

			}); 
		});
	});
};
