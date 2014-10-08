
module.exports = function(app, io, request, models, cookieParser) {

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

		var appid = req.param('appid');
		var uuid  = req.param('uuid');

		console.log(appid);

		var xmpp = {
			host : "sto.xmpp.slack.com",
			user : "helder",
			pass : "sto.OxppPSmAdr8nzxg631nH"
		}

		var api = {
			url    : "https://slack.com/api",
			team   : "STO",
			user   : "helder",
			token  : "xoxp-2193712768-2193712770-2667038169-9743c9",
			invite : "U025PM5P0",
		}

		var channel = "sp-";

		sequelize.waterfall(
			[
				// Check if token is valid
				function(callback) {
					db.query('SELECT room_count FROM app WHERE ? FOR UPDATE; UPDATE app SET room_count = room_count + 1 WHERE ?;', [{ 'token': appid }, { 'token': appid }], function(err, rows) {
						// connected! (unless `err` is set)
						if(rows[0].affectedRows == 0 || rows[1].affectedRows == 0) {
							return callback(1);
						}
						return callback(null, appid, (rows[0][0].room_count + 1));
					});

				},

				// Create Channel
				function(token, channel_id, callback) {

					var channel = "s p-" + channel_id;

					request.post(api.url + '/channels.join', { json: true, form: { token: api.token, name: channel }}, function (error, response, body) {
						if (!error && response.statusCode == 200 && typeof body.channel !== "undefined") {
							return callback(null, body.channel.id);
						}
						return callback(2);
					});

				},

				// Invite user to channel
				function(new_channel, callback) {
					request.post(api.url + '/channels.invite', { json: true, form: { token: api.token, channel: new_channel, user: api.invite }}, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							return callback(null, new_channel);
						}
					});
				},

				// Set purpose of channel
				function(new_channel, callback) {
					request.post(api.url + '/channels.setPurpose', { json: true, form: { token: api.token, channel: new_channel, purpose: "Help this guy out!" }}, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							return callback(null, 'done');
						}
						return callback(3);
					});
				},

			],
			function(err, results) {
				if(err == 2)
					return res.status(404).json({ error: "Error creating the channel" }).end();
				else if(err)
					return res.status(404).json({ error: "Other error!" }).end();

				return res.status(200).json({ success: true }).end();

			}
		);


	});

	// any other request -> redirect to new chat room
	/**
	app.get('/*', function(req, res){
		// generate random chat room ID
		var id = Math.round((Math.random() * 1000000));

		res.redirect('chat/' + id);
	});**/

};
