const app = require("./server");
const chalk = require("chalk");
const _ = require("lodash");
var data = require("./data.js");
const models = app.models;

const callbackHandler = (err, obj) => {
  if (err) {
    return console.log(chalk.red(err));
  }
  console.log(chalk.green(JSON.stringify(obj)));
};

function seedCategories() {
  const categories = _.map(
    _.uniqBy(_.map(data, "category"), "name"),
    category => ({ name: category.name.toLowerCase() })
  );
  models.Category.create(categories, callbackHandler);
}
function seedTypes() {
  const types = _.map(
    _.uniq(_.map(_.map(data, "type"), _.method("toLowerCase"))),
    type => ({ name: type })
  );
  models.Type.create(types, (err, obj) => {
    if (err) {
      return console.log(chalk.red(err));
    }
    console.log(chalk.green(JSON.stringify(obj)));
  });
}

async function getIdsOf(modelName = "Type", field = "") {
  let names = [];
  data.map(product => {
    let name;
    if (field) {
      name = product[modelName.toLowerCase()][field].toLowerCase();
    } else {
      name = product[modelName.toLowerCase()].toLowerCase();
    }
    if (!names.includes(name)) {
      names.push(name);
    }
  });
  nameIds = names.map(name =>
    models[modelName].findOne({
      where: { name }
    })
  );
  return await Promise.all(nameIds);
}

seedCategories();
seedTypes();

(async () => {
  let _products = data.map(product => {
    delete product.category.id;
    product.category = { name: product.category.name.toLowerCase() };
    product.type = { name: product.type.toLowerCase() };
    return product;
  });
  models.Product.create(_products, callbackHandler);
  models.Customer.create(
    {
      firstName: "Moslem",
      lastName: "Ezati",
      username: "moslem",
      email: "moslem.ezati@gmail.com",
      password: "1",
      country: "U.S",
      phone: "+1 818 832 22 33",
      city: "California",
      zip: "11111111",
      companyName: "zagros",
      address: "no 39, Hollywood, California"
    },
    callbackHandler
  );
})();
