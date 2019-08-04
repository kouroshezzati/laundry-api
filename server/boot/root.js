// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

"use strict";
const ModelPagination = require("../../components/pagination/index");
const Contactus = require("../../components/contactus/index");
const { AddOrder, ReceiveOrder } = require("../../components/order/index");
const PaymentWebhook = require("../../components/webhook/payment");

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get("/", server.loopback.status());
  router.get("/api/MyOrders/:id", ModelPagination);
  router.post("/api/contactus", Contactus);
  router.post("/api/AddOrder", AddOrder);
  router.get("/api/Order/:id", ReceiveOrder);
  router.post("/api/payment/webhook", PaymentWebhook);
  server.use(router);
};
