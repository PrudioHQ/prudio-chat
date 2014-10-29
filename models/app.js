"use strict";

var uuid = require('node-uuid');

module.exports = function(sequelize, DataTypes) {
  var App = sequelize.define("app", {
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
    slack_api_token: DataTypes.STRING,
    slack_invite_user: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });

  return App;
};
