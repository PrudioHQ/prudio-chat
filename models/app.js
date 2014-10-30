"use strict";

var uuid = require('node-uuid');

module.exports = function(sequelize, DataTypes) {
  var app = sequelize.define("app", {
    account_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    token: DataTypes.STRING,
    name: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    online: DataTypes.BOOLEAN,
    slack_api_token: DataTypes.STRING,
    slack_invite_user: DataTypes.STRING,
    room_prefix: DataTypes.STRING,
    room_count: DataTypes.INTEGER
  }, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
    tableName: 'apps',
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });

  return app;
};
