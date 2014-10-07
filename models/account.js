"use strict";

module.exports = function(sequelize, DataTypes) {
  var Account = sequelize.define("Account", {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });

  return Account;
};
