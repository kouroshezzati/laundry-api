// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

"use strict";
const ModelPagination = require("../../components/pagination/index");

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get("/", server.loopback.status());
  router.get("/api/MyOrders/:id", ModelPagination);
  server.use(router);
};
