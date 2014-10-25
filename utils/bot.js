var request = require('request'); // github.com/mikeal/request

//var ws = new WebSocket(wss);

module.exports = function(app, slack, models) {

  	models.App.find({ where: { active: true } }).success(function(application) {

		//slack.connect(application.id, application.slack_xmpp_user, application.slack_xmpp_pass, application.slack_xmpp_host);
		request.post(app.get('slack_api_url') + '/rtm.start', { json: true, form: { token: application.slack_api_token, t: Date.now() }}, function (error, response, body) {
			if (!error && response.statusCode == 200 && typeof body.ok !== "undefined" && body.ok == true) {
				//console.log("Body: %j", body.url);
				slack.connect(application.id, body)
			} else {
				//console.log("Body: %j", body);
			}
		});

	});
};
