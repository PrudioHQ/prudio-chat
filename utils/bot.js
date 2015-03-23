// Connect all the bots to the Slack accounts.

module.exports = function(slack, App) {
  	App.find({ active: true, server: 'CHAT' }, function(err, applications) {
        if (err) {
          console.error(err);
        }

        for (var i in applications) {
            var application = applications[i];
            slack.connect(application);
        }
    });
};
