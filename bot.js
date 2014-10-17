

module.exports = function(models, slack) {

  	models.App.find({ where: { active: true } }).success(function(application) {

		slack.connect(application.id, application.slack_xmpp_user, application.slack_xmpp_pass, application.slack_xmpp_host);

	});
};
