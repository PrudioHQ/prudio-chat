
module.exports = function(app, io, request, models, async) {

	function isAuthorized(req, res, next) {
	
		var token = req.param('token');

		models.App.find({ where: { token: token, active: true } }).success(function(app) {
			if(app == null)
				return res.status(401).json({ success: false, message: "Unauthorized" }).send();
			return next();
		});
	}


	app.get('/test', isAuthorized, function(req, res) {

		res.cookie("oghma", 1);

		console.log("Cookies: ", req.cookies);

		return res.status(200).end();
	});



	app.post('/chat/create', isAuthorized, function(req, res, next) {

		var crypto = require('crypto');

		var token            = req.param('token');
		var channel          = req.param('channel');
		var channelSignature = req.param('signature');

		models.App.find({ where: { token: token, active: true } }).success(function(application) {
	
			if(application == null)
				return res.status(404).json({ success: false, message: "Not found" }).send();

			async.waterfall(
				[
					function(callback) {

						// Verify if the user already has previous support (from cookies)
						if(channel != null && channelSignature != null)
						{
							// Returning user with cookie
							var verify = crypto.createHmac('sha1', application.slack_api_token).update(channel).digest('hex');
							
							// Verify signature else it will create a new one!
							if(verify == channelSignature)
								return callback(null, channel);
						}

						

						// No channel or signature, or invalid signature/channel, get the next channel
						models.Room.find({ where: { app_id: application.id }}).success(function(room) {
							room.increment('count').success(function() {
								var chname = "sp-" + room.count;
								return callback(null, chname);
							});
						});

						
					},

					// Create channel
					function(channel, callback) {


						console.log(channel);

						request.post(app.get('slack_api_url') + '/channels.join', { json: true, form: { token: application.slack_api_token, name: channel }}, function (error, response, body) {
							if (!error && response.statusCode == 200 && typeof body.channel !== "undefined") {
								console.log('CH ID: ' + body.channel.id);
								return callback(null, channel, body.channel.id);
							}
							return callback('Create Channel');
						});

					},

					// Invite user to channel
					function(channel, new_channel, callback) {
						request.post(app.get('slack_api_url') + '/channels.invite', { json: true, form: { token: application.slack_api_token, channel: new_channel, user: application.slack_invite_user }}, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								return callback(null, channel, new_channel);
							}
							return callback('Invite user to channel');
						});
					},

					// Set purpose of channel
					function(channel, new_channel, callback) {
						request.post(app.get('slack_api_url') + '/channels.setPurpose', { json: true, form: { token: application.slack_api_token, channel: new_channel, purpose: "Help this guy out!" }}, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								return callback(null, channel);
							}
							return callback('Set purpose of channel');
						});
					},

				],
				function(err, channel) {
					if(err) {
						console.log(err);
						return res.status(404).json({ error: "Error: " + err}).end();
					}

					var signature = crypto.createHmac('sha1', application.slack_api_token).update(channel).digest('hex');

					return res.status(200).json({ success: true, channel: channel, signature: signature }).end();
				}
			);
		});



	});

	// any other request -> redirect to new chat room
	/**
	app.get('/*', function(req, res){
		// generate random chat room ID
		var id = Math.round((Math.random() * 1000000));

		res.redirect('chat/' + id);
	});**/

};
