"use strict";

module.exports = function(sequelize, DataTypes) {
  var Room = sequelize.define("Room", {
    account_id: DataTypes.INTEGER,
    app_id: DataTypes.INTEGER,
    count: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });

  return Room;
};
