"use strict";
module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable("Rooms", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      account_id: {
        type: DataTypes.INTEGER,
        references: "Accounts",
        referencesKey: "id"
      },
      app_id: {
        type: DataTypes.INTEGER,
        references: "Apps",
        referencesKey: "id"
      },
      count: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    });

    migration.addIndex(
      'Rooms',
      ['app_id'],
      {
        indexName: 'UniqueAppId',
        indicesType: 'UNIQUE'
      }
    ).done(done);
  },
  down: function(migration, DataTypes, done) {
    migration.dropTable("Rooms").done(done);
  }
};