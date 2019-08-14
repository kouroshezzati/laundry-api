// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

"use strict";

var loopback = require("loopback");
var boot = require("loopback-boot");
var cors = require("cors");
var i18n = require("i18n");

i18n.configure({
  locales: ["en", "du"],
  directory: __dirname + "/locales",
  register: global
});

var app = (module.exports = loopback());
app.use(cors());
app.use(i18n.init);
app.use((req, res, next) => {
  i18n.setLocale(req.query.lang || "en");
  next();
});

app.start = function() {
  return app.listen(app.get("port"), function() {
    app.emit("started");
    var baseUrl = app.get("url").replace(/\/$/, "");
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
