const app = require("../../server/server");
const chalk = require("chalk");
const models = app.models;
const mollie = require("@mollie/api-client")({
  apiKey: "test_DmRVtMkQJjrfS4Fr6xhubMybpwHfuK"
});

const ADD = "ADD";
const SUB = "SUB";

const multipleCurrency = (number, time) => {
  if (typeof number !== "string") {
    number = String(number);
  }
  const numbers = number.split(".");
  if (numbers.length === 1) {
    numbers.push("00");
  }
  if (numbers[1].length === 2) {
    return (number * time).toFixed(2);
  }
  return String(number * time);
};

const calc = (operator, a, b) => {
  if (!a || a === 0 || a === "0") {
    a = "0.00";
  }
  if (!b || b === 0 || b === "0") {
    b = "0.00";
  }

  const aNumbers = a.split(".");
  const bNumbers = b.split(".");
  let left, right;
  if (operator === ADD) {
    left = +aNumbers[0] + +bNumbers[0];
    right = +aNumbers[1] + +bNumbers[1];
    if (right >= 100) {
      left++;
      right = String(right / 100).split(".")[1] || 0;
      right = String(right);
      right = right.length === 1 ? right + "0" : right;
    }
  } else if (operator === SUB) {
    left = +aNumbers[0] - +bNumbers[0];
    right = +aNumbers[1] - +bNumbers[1];
    if (right < 0) {
      if (left === 0) {
        left = "-0";
      } else {
        left -= 1;
      }
      right *= -1;
    }
  }
  if (right === 0) {
    right += "0";
  }
  return `${left}.${right}`;
};

const AddOrder = async (req, res) => {
  try {
    const { Order, Invoice, Product, Customer } = models;
    const {
      customerId,
      description = "",
      deliver_date,
      pickup_date
    } = req.body;
    if (!customerId) {
      throw new Error("Customer id is not found. please provide it!");
    }
    const theCustomer = Customer.findOne({ where: { customerId } });
    if (!theCustomer) {
      throw new Error("There is no customer with this id");
    }
    console.log(
      "the customer is :",
      chalk.green(JSON.stringify(theCustomer, null, 2))
    );
    Order.create(
      {
        customerId,
        description,
        deliver_date,
        pickup_date,
        date: new Date()
      },
      (err, model) => {
        if (err) {
          throw new Error(err);
        }
        const orderId = model.id;
        let { invoices } = req.body;
        invoices = invoices.map(_invoice => ({ ..._invoice, orderId }));
        const selectedProducts = {};
        const mailInvoices = [];
        invoices.map(_invoice => {
          selectedProducts[_invoice.productId] = _invoice.number;
        });
        console.log(chalk.blue(JSON.stringify(invoices)));
        Invoice.create(invoices, async (err, invoiceModel) => {
          if (err) {
            throw new Error(err);
          }
          let price;
          await Promise.all(
            invoiceModel.map(async _invoice => {
              const product = await Product.findOne({
                where: { id: _invoice.productId }
              });
              price = calc(
                ADD,
                multipleCurrency(product.price, _invoice.number),
                price
              );
              const theInvoice = invoices.find(__invoice => {
                return __invoice.productId == product.id;
              });
              mailInvoices.push({
                ...theInvoice,
                name: product.name,
                price: product.price
              });
              console.log("the product is", theInvoice);
            })
          );
          console.log(chalk.green("total price is: ", price));
          const paymentPayload = {
            amount: {
              value: price,
              currency: "EUR"
            },
            redirectUrl: "https://www.bubblesonline.nl/invoice/" + orderId,
            webhookUrl:
              "https://www.bubblesonline.nl/api/payment/webhook/" + orderId,
            metadata: {
              selectedProducts,
              price,
              customerId,
              orderId,
              deliver_date,
              pickup_date,
              mailInvoices,
              theCustomer
            }
          };
          paymentPayload.description = description
            ? description
            : `order id is: ${orderId}`;
          console.log(
            "The payment payload:",
            chalk.green(JSON.stringify(paymentPayload))
          );
          mollie.payments
            .create(paymentPayload)
            .then(async payment => {
              const orderUpdateResult = await Order.updateAll(
                { id: orderId },
                { paymentId: payment.id, amount: price }
              );
              console.log(
                "the update order record result is:",
                chalk.green(JSON.stringify(orderUpdateResult, 2, null))
              );
              res.send(payment.getPaymentUrl());
            })
            .catch(err => {
              console.log(JSON.stringify(err, 2, null));
              throw new Error(err);
            });
        });
      }
    );
  } catch (err) {
    console.log(chalk.red(err));
    res.send(err);
  }
};

const ReceiveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { Order, Invoice } = models;
    const result = await Order.updateAll({ id }, { payed: true });
    if (result.count === 1) {
      // const invoices = await Invoice.findAll({ where: { orderId: id } });
      // console.log(chalk.green(JSON.stringify(invoices)));
      console.log("Redirect to https://www.bubblesonline.nl/invoice/" + id);
      res.writeHead(302, {
        location: "https://www.bubblesonline.nl/invoice/" + id
      });
      return res.end();
    }
    res.status(404).end();
  } catch (err) {
    res.json(err);
  }
};

module.exports = { AddOrder, ReceiveOrder };
