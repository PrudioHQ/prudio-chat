var request = require('request'); // github.com/mikeal/request

//var ws = new WebSocket(wss);

module.exports = function(app, slack, models) {

  	models.App.find({ where: { active: true } }).success(function(application) {

		slack.connect(application);

	});
};
