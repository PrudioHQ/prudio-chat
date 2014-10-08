"use strict";

var uuid = require('node-uuid');

module.exports = function(sequelize, DataTypes) {
  var App = sequelize.define("App", {
    account_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    token: {
      type: DataTypes.STRING,
      set:  function(val) {
          if(val == null || val.length == 0) {
            var token = uuid.v4();
            this.setDataValue('token', token);
          }
      }
    },
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
