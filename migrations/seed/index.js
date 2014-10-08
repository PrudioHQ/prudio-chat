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
        slack_xmpp_host: 'sto.xmpp.slack.com',
        slack_xmpp_user: 'helder',
        slack_xmpp_pass: 'sto.OxppPSmAdr8nzxg631nH',
        slack_api_token: 'xoxp-2193712768-2193712770-2667038169-9743c9',
        slack_invite_user: 'U025PM5P0'
      }).success(function(app) {
        models.Room.create({
          account_id: account.id,
          app_id: app.id
        });
      });
    });
  });
};