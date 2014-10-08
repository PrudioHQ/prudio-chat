
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

		var token = req.param('token');

		models.App.find({ where: { token: token, active: true } }).success(function(application) {
	
			if(application == null)
				return res.status(404).json({ success: false, message: "Not found" }).send();

			console.log("Enter waterfall")

			async.waterfall(
				[
					// Check if token is valid
					function(callback) {

						models.Room.find({ where: { app_id: application.id }}).success(function(room) {
							room.increment('count').success(function() {
								console.log(room.count);
								return callback(null, room.count);
							});
						});
					},

					// Create Channel
					function(channel_id, callback) {

						var channel = "sp-" + channel_id;

						console.log(channel);

						request.post(app.get('slack_api_url') + '/channels.join', { json: true, form: { token: application.slack_api_token, name: channel }}, function (error, response, body) {
							if (!error && response.statusCode == 200 && typeof body.channel !== "undefined") {
								console.log('CH ID: ' + body.channel.id);
								return callback(null, body.channel.id);
							}
							return callback('Create Channel');
						});

					},

					// Invite user to channel
					function(new_channel, callback) {
						request.post(app.get('slack_api_url') + '/channels.invite', { json: true, form: { token: application.slack_api_token, channel: new_channel, user: application.slack_user_invite }}, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								return callback(null, new_channel);
							}
							return callback('Invite user to channel');
						});
					},

					// Set purpose of channel
					function(new_channel, callback) {
						request.post(app.get('slack_api_url') + '/channels.setPurpose', { json: true, form: { token: application.slack_api_token, channel: new_channel, purpose: "Help this guy out!" }}, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								return callback(null, 'done');
							}
							return callback('Set purpose of channel');
						});
					},

				],
				function(err, results) {
					if(err) {
						console.log(err);
						return res.status(404).json({ error: "Error: " + err}).end();
					}

					return res.status(200).json({ success: true }).end();

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
