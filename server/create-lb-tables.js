var path = require("path");
var lodash = require("lodash");
var app = require(path.resolve(__dirname, "./server.js"));
var models = require("./model-config.json");

function autoMigrateAll(dataSourceName) {
  var ds = app.datasources[dataSourceName];

  console.warn("----------------------------------------------");
  console.warn("[WARNING] This process will drop all your data");
  console.warn("----------------------------------------------");

  const tables = [];
  lodash.forEach(models, function(val, key) {
    if (val.dataSource === dataSourceName && !val.noMigration) tables.push(key);
  });

  console.log("Migrating database with tables ", tables);

  ds.automigrate(tables, function(err) {
    if (err) throw err;

    ds.disconnect();

    console.log("Migration done, happy coding :)");

    process.exit();
  });
}

// migrate only datasource with name 'mainDS'
autoMigrateAll("postgresDS");
