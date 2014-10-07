"use strict";
module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable("Apps", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      accountId: {
        type: DataTypes.INTEGER
      },
      userId: {
        type: DataTypes.INTEGER
      },
      name: {
        type: DataTypes.STRING
      },
      active: {
        type: DataTypes.BOOLEAN
      },
      online: {
        type: DataTypes.BOOLEAN
      },
      xmpp_host: {
        type: DataTypes.STRING
      },
      xmpp_user: {
        type: DataTypes.STRING
      },
      xmpp_pass: {
        type: DataTypes.STRING
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    }).done(done);
  },
  down: function(migration, DataTypes, done) {
    migration.dropTable("Apps").done(done);
  }
};