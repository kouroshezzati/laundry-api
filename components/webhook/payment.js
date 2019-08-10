const app = require("../../server/server");
const chalk = require("chalk");
const models = app.models;
const mollie = require("@mollie/api-client")({
  apiKey: "test_DmRVtMkQJjrfS4Fr6xhubMybpwHfuK"
});
const sendmail = require("sendmail")({
  logger: {
    debug: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  },
  smtpPort: 25, // Default: 25
  smtpHost: "localhost" // Default: -1 - extra smtp host after resolveMX
});

module.exports = async (req, res) => {
  try {
    const { Order } = models;
    const { orderId } = req.params;
    const order = await Order.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error("Invalid order id!");
    }
    const payment = await mollie.payments.get(order.paymentId);
    await Order.updateAll({ id: orderId }, { status: payment.status });
    console.log(
      chalk.red(`order id:${orderId}'s payment status is ${payment.status}`)
    );
    const { metadata } = payment;
    const { mailInvoices, theCustomer } = metadata;
    let invoiceItems = `<table>
    <tr><td>ID</td><td>Name</td><td>Number</td><td>Price</td></tr>`;
    mailInvoices.forEach(mailInvoice => {
      invoiceItems += `<tr>
      <td>${mailInvoice.productId}</td>
      <td>${mailInvoice.name}</td>
      <td>${mailInvoice.number}</td>
      <td>${mailInvoice.price}</td>
      </tr>`;
    });
    invoiceItems += `</table>`;
    const customerInformation = `<div>
    <div style="max-width: 150px">Customer information</div>
      <table>
        <tr>
          <td>Name:</td>
          <td>${theCustomer.firstName} ${theCustomer.lastName}</td>
        </tr>
        <tr><td>Apartment:</td><td>${theCustomer.apartment}</td></tr>
        <tr><td>Address:</td><td>${theCustomer.address}</td></tr>
        <tr><td>Zip:</td><td>${theCustomer.zip}</td></tr>
        <tr><td>City:</td><td>${theCustomer.city}</td></tr>
        <tr><td>Country:</td><td>${theCustomer.country}</td></tr>
        <tr><td>Phone:</td><td>${theCustomer.phone}</td></tr>
        <tr><td>Email:</td><td>${theCustomer.email}</td></tr>
        <tr><td>CompanyName:</td><td>${theCustomer.companyName}</td></tr>
        <tr><td>Description:</td><td>${theCustomer.description}</td></tr>
      </div>
    </div>`;

    if (payment.status === "paid") {
      sendmail(
        {
          from: "no-replay@bubblesonline.nl",
          to: "info@bubblesonline.nl",
          subject: "payment",
          html: `<h3>There is payment orderd with these information</h3>
          ${invoiceItems}
          <hr>
          ${customerInformation}
          `
        },
        function(err, reply) {
          if (err) {
            console.log(err && err.stack);
            return res.JSON({ err });
          }
          console.log(reply);
          return res.json({
            reply,
            responseCode: 0,
            responseDesc: "Sucess",
            payment
          });
        }
      );
    } else {
      res.status(404).send(orderId + " order is not paid");
    }
  } catch (err) {
    console.log(chalk.red(err));
    res.send(err);
  }
};
