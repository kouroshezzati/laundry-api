const app = require("../../server/server");
const chalk = require("chalk");
const models = app.models;
const mollie = require("@mollie/api-client")({
  apiKey: "test_DmRVtMkQJjrfS4Fr6xhubMybpwHfuK"
});

const GetPaymentWithInvoices = async orderId => {
  try {
    const { Order, Customer, Invoice, Product } = models;
    const order = await Order.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error(`There is no such order with ${orderId} id!`);
    }
    const payment = await mollie.payments.get(order.paymentId);
    await Order.updateAll({ id: orderId }, { status: payment.status });
    console.log(
      chalk.red(`order id:${orderId}'s payment status is ${payment.status}`)
    );
    const { customerId } = payment.metadata;
    const theCustomer = await Customer.findOne({ where: { id: customerId } });
    console.log('the customer is', theCustomer);
    const theOrder = await Order.findOne({ where: { id: orderId } });
    const theInvoices = await Invoice.find({ where: { orderId } });
    let mailInvoices = [];
    await Promise.all(
      theInvoices.map(async _theInvoice => {
        const theProduct = await Product.findOne({
          where: { id: _theInvoice.productId }
        });
        mailInvoices.push({
          price: theProduct.price,
          number: _theInvoice.number,
          productId: _theInvoice.productId,
          name: theProduct.name
        });
      })
    );
    return { mailInvoices, theInvoices, theOrder, payment };
  } catch (err) {
    return err;
  }
};

module.exports = { GetPaymentWithInvoices };
