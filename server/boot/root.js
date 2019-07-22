// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

"use strict";
const ModelPagination = require("../../components/pagination/index");
var nodemailer = require("nodemailer");

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get("/", server.loopback.status());
  router.get("/api/MyOrders/:id", ModelPagination);
  router.get("/test", (req, res) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "moslem.ezati@gmail.com",
        pass: "Moslem_85_gmail"
      }
    });
    var mailOptions = {
      from: "moslem.ezati@gmail.com",
      to: "moslem.ezati@gmail.com",
      subject: "Sending Email using Node.js",
      text: "That was easy!"
    };
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        return res.send(error);
      } else {
        return res.send("Email sent: " + info.response);
      }
    });
  });
  server.use(router);
};
