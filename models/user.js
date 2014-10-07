"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    accountId: DataTypes.INTEGER,
    fname: DataTypes.STRING,
    lname: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });

  return User;
};
