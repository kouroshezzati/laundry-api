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

const imgLogo = `<img 
        style="height:111px;width:100px;" 
        src="https://www.bubblesonline.nl/static/media/logo_65.8ebfed72.png" />`;

module.exports = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      throw new Error("The order id must be defined!");
    }
    const {
      theCustomer,
      theOrder,
      mailInvoices,
      payment
    } = await GetPaymentWithInvoices(orderId);    
    let invoiceItems = `
    <div>Order id:  ${orderId}</div>
    <div>Pickup date:  ${moment(theOrder.pickup_date).format(
      "MMMM D, YYYY HH:mm"
    )}</div>
    <div>Deliver date:  ${moment(theOrder.deliver_date).format(
      "MMMM D, YYYY HH:mm"
    )}</div>
    <table style="text-align: center;">
    <tr style="font-weight: 700;background: lightgray;padding: 5px;">
      <th>ID</th><th>Name</th><th>Number</th><th>Price of each</th><th>Price</th>
    </tr>`;
    mailInvoices.forEach(mailInvoice => {
      invoiceItems += `<tr>
      <td>${mailInvoice.productId}</td>
      <td>${mailInvoice.name}</td>
      <td>${mailInvoice.number}</td>
      <td>&euro; ${mailInvoice.price}</td>
      <td>&euro; ${multipleCurrency(
        mailInvoice.number,
        mailInvoice.price
      )}</td>
      </tr>`;
    });
    invoiceItems += `</table><h3>Sum: &euro; ${payment.metadata.price}</h3>`;
    if (theOrder.description) {
      invoiceItems += `<h4>Description: ${theOrder.description}</h4>`;
    }
    const customerInformation = `<div>
    <h3>Customer information:</h3>
      <table>
        <tr>
          <td>Name:</td>
          <td>${theCustomer.firstName} ${theCustomer.lastName}</td>
        </tr>
        ${
          theCustomer.apartment
            ? `<tr><td>Apartment:</td><td>${theCustomer.apartment}</td></tr>`
            : ""
        }
        <tr><td>Address:</td><td>${theCustomer.address}</td></tr>
        <tr><td>Zip:</td><td>${theCustomer.zip}</td></tr>
        <tr><td>City:</td><td>${theCustomer.city}</td></tr>
        <tr><td>Country:</td><td>${theCustomer.country}</td></tr>
        <tr><td>Phone:</td><td>${theCustomer.phone}</td></tr>
        <tr><td>Email:</td><td>${theCustomer.email}</td></tr>
        ${
          theCustomer.companyName
            ? `<tr><td>CompanyName:</td><td>${
                theCustomer.companyName
              }</td></tr>`
            : ""
        }
        </table>
      </div>
    </div>`;
    if (payment.status === "paid") {
      sendmail(
        {
          from: "no-replay@bubblesonline.nl",
          to: ["info@bubblesonline.nl", theCustomer.email],
          subject: "payment",
          html: `<div style="text-align: center;">${imgLogo}</div>
          <h3>There is payment orderd with these information</h3>
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
          console.log(reply);
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
    res.send(err);
  }
};
