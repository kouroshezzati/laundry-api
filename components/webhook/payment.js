const app = require("../../server/server");
const chalk = require("chalk");
const models = app.models;
const mollie = require("@mollie/api-client")({
  apiKey: "test_DmRVtMkQJjrfS4Fr6xhubMybpwHfuK"
});

module.exports = async (req, res) => {
  try {
    const { Order } = models;
    const { orderId } = req.params;
    const order = await Order.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error("Invalid order id!");
    }
    console.log("the order result is", order);
    const payment = await mollie.payments.get(order.paymentId);
    await Order.updateAll({ id: orderId }, { status: payment.status });
    console.log(
      chalk.red(`order id:${orderId}'s payment status is ${payment.status}`)
    );
    res.json(payment);
  } catch (err) {
    console.log(chalk.red(err));
    res.send(err);
  }
};
