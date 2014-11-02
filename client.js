var async   = require('async');
var request = require('request'); // github.com/mikeal/request

module.exports = function(app, io, slack, models) {

	var application = null;

	function isAuthorized(req, res, next) {

		var token = req.param('token');

		if(token == null)
			return res.status(401).json({ success: false, message: "Unauthorized" });

		models.app.find({ where: { token: token } }).success(function(app) {
			if(app == null)
				return res.status(401).json({ success: false, message: "Unauthorized" });

			if(app.online == false)
				return res.status(503).json({ success: false, message: "Support offline" });

			if(app.active == false)
				return res.status(404).json({ success: false, message: "Application offline" });

			application = app;

			return next();
		});
	}

	app.get('/', function(req, res, next) {
		return res.status(200).json({ success: true, message: "Welcome, nothing here" });
	});

	app.post('/app/connect', isAuthorized, function(req, res, next) {
		var token            = req.param('token');
		models.app.find({ where: { token: token, active: true } }).success(function(application) {
			slack.connect(application);

			return res.status(200).json({ success: true, message: "Initializing" });
		});
	});

	app.post('/app/disconnect', isAuthorized, function(req, res, next) {
		var token            = req.param('token');
		models.app.find({ where: { token: token, active: true } }).success(function(application) {
			slack.disconnect(application.id);

			return res.status(200).json({ success: true, message: "Disconnecting" });
		});
	});
	
	app.post('/chat/create', isAuthorized, function(req, res, next) {

		var crypto = require('crypto');

		var token            = req.param('token');
		var channel          = req.param('channel');
		var channelSignature = req.param('signature');
		var userInfo         = req.param('userInfo');
		var settings         = req.param('settings');

		models.app.find({ where: { token: token, active: true } }).success(function(application) {
	
			if(application == null)
				return res.status(404).json({ success: false, message: "Not found" });

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
						application.increment('room_count').success(function() {
							var chname = application.room_prefix + application.room_count; 
							return callback(null, chname);
						});

						
					},

					// Create channel
					function(channel, callback) {

						request.post(app.get('slack_api_url') + '/channels.join', { json: true, form: { token: application.slack_api_token, name: channel }}, function (error, response, body) {
							if (!error && response.statusCode == 200 && typeof body.channel !== "undefined") {
								return callback(null, channel, body.channel.id);
							}
							return callback('Create Channel');
						});

					},

					// Invite user to channel
					function(channel, channelId, callback) {
						request.post(app.get('slack_api_url') + '/channels.invite', { json: true, form: { token: application.slack_api_token, channel: channelId, user: application.slack_invite_user }}, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								return callback(null, channel, channelId);
							}
							return callback('Invite user to channel');
						});
					},

					// Set purpose of channel
					function(channel, channelId, callback) {
						var info     = JSON.parse(userInfo);
						var personal = JSON.parse(settings);

						var topic = "Help!" +
						"\nName: " + personal.name + " (" + personal.email + ")" +
						"\nURL: " + info.url + " (" + req.ip + ")" +
						"\nBrowser: " + info.browser + " - " + info.browserVersion + 
						"\nOS: " + info.os + " - " + info.osVersion +
						"\nMobile: " + info.mobile +" - Screen resolution: " + info.screen;

						request.post(app.get('slack_api_url') + '/channels.setPurpose', { json: true, form: { token: application.slack_api_token, channel: channelId, purpose: topic }}, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								return callback(null, channel, channelId);
							}
							return callback('Set purpose of channel');
						});
					},

				],
				function(err, channel, channelId) {
					if(err) {
						console.log(err);
						return res.status(404).json({ error: "Error: " + err});
					}

					var signature = crypto.createHmac('sha1', application.slack_api_token).update(channelId).digest('hex');

					return res.status(200).json({ success: true, channel: channelId, signature: signature });
				}
			);
		});



	});

};