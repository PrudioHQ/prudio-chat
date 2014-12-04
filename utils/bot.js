// Connect all the bots to the Slack accounts.

module.exports = function(slack, models) {
  	models.app.find({ where: { active: true } }).success(function(application) {
		slack.connect(application);
	});
};
