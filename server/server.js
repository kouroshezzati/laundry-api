// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

"use strict";

var loopback = require("loopback");
var boot = require("loopback-boot");
var https = require("https");
var sslConfig = require("./ssl-config");

var app = (module.exports = loopback());

app.start = function() {
  // start the web
  var options = {
    key: sslConfig.privateKey,
    cert: sslConfig.certificate
  };
  var server = https.createServer(options, app);
  return server.listen(app.get("port"), function() {
    app.emit("started");
    var baseUrl = `https://localhost:${app.get("port")}`;
    // var baseUrl = app.get('url').replace(/\/$/, '');
    console.log("Web server listening at: %s", baseUrl);
    if (app.get("loopback-component-explorer")) {
      var explorerPath = app.get("loopback-component-explorer").mountPath;
      console.log("Browse your REST API at %s%s", baseUrl, explorerPath);
    }
  });
};

app.middleware("auth", loopback.token());

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) app.start();
});
