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
        token: null,
        xmpp_host: 'sto.xmpp.slack.com',
        xmpp_user: 'helder',
        xmpp_pass: 'sto.OxppPSmAdr8nzxg631nH',
      });
    });
  });

};