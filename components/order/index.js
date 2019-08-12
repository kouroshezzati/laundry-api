const app = require("../../server/server");
const chalk = require("chalk");
const models = app.models;
const mollie = require("@mollie/api-client")({
  apiKey: "test_DmRVtMkQJjrfS4Fr6xhubMybpwHfuK"
});
const { GetPaymentWithInvoices } = require("../payment/index");
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
    const theCustomer = await Customer.findOne({ where: { customerId } });
    if (!theCustomer) {
      throw new Error("There is no customer with this id");
    }
    const { firstName } = theCustomer;
    console.log("the customer result is", chalk.green(firstName));
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
        invoices.map(_invoice => {
          selectedProducts[_invoice.productId] = _invoice.number;
        });
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
            })
          );
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
              orderId
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

const GetOrder = async (req, res) => {
  try {
    const { id, customerId } = req.params;
    if (!id) {
      throw new Error("The order id must be provided!");
    }
    if (!customerId) {
      throw new Error("The customer id must be provided!");
    }
    const {
      payment,
      theCustomer,
      theOrder,
      theMailInvoices
    } = await GetPaymentWithInvoices(id);
    if (customerId != theCustomer.id) {
      throw new Error("The customer id is unauthorized!");
    }
    res.json({
      selectedProducts: payment.metadata.selectedProducts,
      price: payment.price,
      pickup_date: theOrder.pickup_date,
      deliver_date: theOrder.deliver_date,
      invoices: theMailInvoices,
      status: payment.status
    });
  } catch (err) {
    res.status(500).send(err);
  }
};

module.exports = { AddOrder, ReceiveOrder, calc, multipleCurrency, GetOrder };
