// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

"use strict";
const ModelPagination = require("../../components/pagination/index");
const Contactus = require("../../components/contactus/index");
const { AddOrder, GetOrder } = require("../../components/order/index");
const PaymentWebhook = require("../../components/payment/webhook");
const path = require('path');

module.exports = function(server) {
  var router = server.loopback.Router();
  router.get("/api/logo", (req, res) => {
    res.sendFile(path.resolve('client/logo.png'))
  });
  router.get("/api/MyOrders/:id", ModelPagination);
  router.post("/api/contactus", Contactus);
  router.post("/api/AddOrder", AddOrder);
  router.get("/api/PaidOrder/:id/:customerId", GetOrder);
  router.post("/api/payment/webhook/:orderId", PaymentWebhook);
  server.use(router);
};
