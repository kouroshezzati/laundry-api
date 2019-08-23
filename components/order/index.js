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
      pickup_date,
      invoices
    } = req.body;
    let price;
    const { lang } = req.query;
    if (!customerId) {
      throw new Error("Customer id is not found. please provide it!");
    }
    const theCustomer = await Customer.findOne({ where: { customerId } });
    if (!theCustomer) {
      throw new Error("There is no customer with this id");
    }
    await Promise.all(
      invoices.map(async _invoice => {
        const _product = await Product.findOne({
          where: { id: _invoice.productId }
        });
        price = calc(
          ADD,
          multipleCurrency(_product.price, _invoice.number),
          price
        );
      })
    );
    if (parseFloat(price) < 22) {
      throw new Error("The minimum order is 22 euro!");
    }
    const createdOrder = await Order.create({
      customerId,
      description,
      deliver_date,
      pickup_date,
      date: new Date()
    });
    const orderId = createdOrder.id;
    _invoices = invoices.map(_invoice => ({
      ..._invoice,
      orderId: String(orderId)
    }));
    const selectedProducts = {};
    _invoices.map(_invoice => {
      selectedProducts[_invoice.productId] = _invoice.number;
    });
    await Invoice.create(_invoices);
    const paymentPayload = {
      amount: {
        value: price,
        currency: "EUR"
      },
      redirectUrl: `https://bubblesonline.nl/invoice/${orderId}`,
      webhookUrl: `https://bubblesonline.nl/api/payment/webhook/${orderId}?lang=${lang}`,
      metadata: {
        selectedProducts,
        price,
        customerId,
        orderId,
        lang
      }
    };
    paymentPayload.description = description
      ? description
      : `order id is: ${orderId}`;
    console.log(
      "The payment payload:",
      chalk.green(JSON.stringify(paymentPayload))
    );
    const payment = await mollie.payments.create(paymentPayload);
    const orderUpdateResult = await Order.updateAll(
      { id: orderId },
      { paymentId: payment.id, amount: price }
    );
    if (orderUpdateResult.count !== 1) {
      throw new Error(`Error: Failure in update order with ${orderId} id!`);
    }
    res.send(payment.getPaymentUrl());
  } catch (err) {
    console.log(chalk.red(err.message));
    return res.status(400).send({ error: err.message });
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
      price: payment.metadata.price,
      pickup_date: theOrder.pickup_date,
      deliver_date: theOrder.deliver_date,
      invoices: theMailInvoices,
      status: payment.status
    });
  } catch (err) {
    res.status(500).send(err);
  }
};

module.exports = { AddOrder, calc, multipleCurrency, GetOrder };
