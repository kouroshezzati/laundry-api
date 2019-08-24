const chalk = require("chalk");
const moment = require("moment");
const { multipleCurrency } = require("../order/index");
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
const { GetPaymentWithInvoices } = require("./index");

const imgLogo = `<img src="https://www.bubblesonline.nl/api/logo" />`;

module.exports = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      throw new Error("The order id must be defined!");
    }
    console.log("order id", orderId);
    const {
      theCustomer,
      theOrder,
      mailInvoices,
      payment
    } = await GetPaymentWithInvoices(orderId);
    let invoiceItems = `
    <div>${__("Order id")}:  ${orderId}</div>
    <div>${__("Pickup date")}:  ${moment(theOrder.pickup_date).format(
      "MMMM D, YYYY HH:mm"
    )}</div>
    <div>${__("Deliver date")}:  ${moment(theOrder.deliver_date).format(
      "MMMM D, YYYY HH:mm"
    )}</div>
    <table style="text-align: center;">
    <tr style="font-weight: 700;background: lightgray;padding: 5px;">
      <th>${__("ID")}</th>
      <th>${__("Name")}</th>
      <th>${__("Number")}</th>
      <th>${__("Price of each")}</th>
      <th>${__("Price")}</th>
    </tr>`;
    mailInvoices.forEach(mailInvoice => {
      invoiceItems += `<tr>
      <td>${mailInvoice.productId}</td>
      <td>${mailInvoice.name}</td>
      <td>${mailInvoice.number}</td>
      <td>&euro; ${mailInvoice.price}</td>
      <td>&euro; ${multipleCurrency(mailInvoice.number, mailInvoice.price)}</td>
      </tr>`;
    });
    invoiceItems += `</table><h3>${__("Sum")}: &euro; ${
      payment.metadata.price
    }</h3>`;
    if (theOrder.description) {
      invoiceItems += `<h4>${__("Description")}: ${theOrder.description}</h4>`;
    }
    const customerInformation = `<div>
    <h3>${__("Customer information")}:</h3>
      <table>
        <tr>
          <td>${__("Name")}:</td>
          <td>${theCustomer.firstName} ${theCustomer.lastName}</td>
        </tr>
        ${
          theCustomer.apartment
            ? `<tr><td>${__("Apartment")}:</td><td>${
                theCustomer.apartment
              }</td></tr>`
            : ""
        }
        <tr><td>${__("Address")}:</td><td>${theCustomer.address}</td></tr>
        <tr><td>${__("Zip")}:</td><td>${theCustomer.zip}</td></tr>
        <tr><td>${__("City")}:</td><td>${theCustomer.city}</td></tr>
        <tr><td>${__("Country")}:</td><td>${theCustomer.country}</td></tr>
        <tr><td>${__("Phone")}:</td><td>${theCustomer.phone}</td></tr>
        <tr><td>${__("Email")}:</td><td>${theCustomer.email}</td></tr>
        ${
          theCustomer.companyName
            ? `<tr><td>${__("CompanyName")}:</td><td>${
                theCustomer.companyName
              }</td></tr>`
            : ""
        }
        </table>
      </div>
    </div>`;
    console.log("payment status:", payment.status);
    if (payment.status === "paid") {
      await sendmail(
        {
          from: "no-replay@bubblesonline.nl",
          to: ["info@bubblesonline.nl", theCustomer.email],
          subject: "Payment",
          html: `<div style="text-align: center;">${imgLogo}</div>
          <h3>${__("There is payment orderd with these information")}</h3>
          ${invoiceItems}
          <hr>
          ${customerInformation}
          <p style="text-align: center;">Bubblesonline &copy; 2019.</p>`
        },
        function(err, reply) {
          if (err) {
            console.log(err && err.stack);
            return res.JSON({ err });
          }
          console.log("the reply sendmail function is", reply);
          return res.json({
            payment,
            pickupDate: theOrder.pickup_date,
            deliverDate: theOrder.deliver_date
          });
        }
      );
    } else {
      res.status(404).send(orderId + " order is not paid");
    }
  } catch (err) {
    console.log(chalk.red(err));
    res.status(500).send(err);
  }
};
