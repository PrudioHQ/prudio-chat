"use strict";

module.exports = function(sequelize, DataTypes) {
  var App = sequelize.define("App", {
    accountId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    online: DataTypes.BOOLEAN,
    xmpp_host: DataTypes.STRING,
    xmpp_user: DataTypes.STRING,
    xmpp_pass: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });

  return App;
};
