const app = require("../../server/server");
const chalk = require("chalk");
const models = app.models;

module.exports = async (req, res) => {
  try {
    const Order = models.Order;
    const Invoice = models.Invoice;
    const Product = models.Product;
    const customerId = req.params.id;
    const {skip, limit} = req.query;
    if (isNaN(customerId)) {
      throw new Error(customerId + " is invalid id, try again.");
    }
    if(skip && isNaN(skip)){
      throw new Error(skip + " is invalid skip parameter, try again.");
    }
    if(limit && isNaN(limit)){
      throw new Error(limit + " is invalid limit parameter, try again.");
    }
    const count = await Order.count();
    let data = {count, skip, limit};
    const orders = await Order.find({ where: { customerId }, skip, limit });
    orders.map(
      order =>
        (data[order.id] = {
          products: [],
          transaction: order.transaction,
          payed: order.payed,
          description: order.description,
          date: order.date
        })
    );
    const invoices = orders.map(async order => {
      try {
        const _invoices = await Invoice.find({ where: { orderId: order.id } });
        const products = _invoices.map(async invoice => {
          return new Promise(async (resolve, reject) => {
            try {
              const _products = await Product.findOne({
                where: { id: invoice.productId }
              });
              _products.number = invoice.number;
              data[order.id].products.push(_products);
              data[order.id].amount = order.amount;
              return resolve(_products);
            } catch (e) {
              console.log(chalk.red(e));
              return reject(e);
            }
          });
        });
        await Promise.all(products);
      } catch (e) {
        console.log(chalk.red(e));
      }
    });
    await Promise.all(invoices);
    res.json(data);
  } catch (e) {
    console.log(chalk.red(e));
    res.json({});
  }
};
