module.exports = function(models) {

  models.Account.create({
    name: 'Le Account'
  }).success(function(account) {
    models.User.create({
      account_id: account.id,
      fname: 'Hélder',
      lname: 'Duarte',
      email: 'me@example.com',
      password: '123456'
    }).success(function(user) {
      models.App.create({
        account_id: account.id,
        user_id: user.id,
        name: 'Le App',
        token: '77475a1d-d347-4514-b0b3-1f01c1a205ea',
        active: true,
        online: true,
        slack_xmpp_host: 'sto.xmpp.slack.com',
        slack_xmpp_user: 'bot',
        slack_xmpp_pass: 'sto.7cB5LEpKdFGMrZZXBeXC',
        slack_api_token: 'xoxp-2193712768-2803840916-2803918718-a0388a',
        slack_invite_user: 'U025PLYNN'
      }).success(function(app) {
        models.Room.create({
          account_id: account.id,
          app_id: app.id,
          count: 0
        });
      });
    });
  });
};