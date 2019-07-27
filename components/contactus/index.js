const request = require("request");
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

module.exports = (req, res) => {
  try {
    console.log(req.body);
    const recaptchaResponse = req.body["g-recaptcha-response"];
    if (
      recaptchaResponse === undefined ||
      recaptchaResponse === "" ||
      recaptchaResponse === null
    ) {
      return res.json({
        responseCode: 1,
        responseDesc: "Please select captcha"
      });
    }
    // Put your secret key here.
    var secretKey = "6LePa68UAAAAAAwxGd6S0WSJqHCXBLozIDkkqUTN";
    // req.connection.remoteAddress will provide IP address of connected user.
    var verificationUrl =
      "https://www.google.com/recaptcha/api/siteverify?secret=" +
      secretKey +
      "&response=" +
      recaptchaResponse +
      "&remoteip=" +
      req.connection.remoteAddress;
    // Hitting GET request to the URL, Google will respond with success or error scenario.
    request(verificationUrl, function(error, response, body) {
      body = JSON.parse(body);
      // Success will be true or false depending upon captcha validation.
      if (body.success !== undefined && !body.success) {
        return res.json({
          responseCode: 1,
          responseDesc: "Failed captcha verification"
        });
      }
      sendmail(
        {
          from: req.body.from,
          to: "info@bubblesonline.nl",
          subject: req.body.subject,
          body: req.body.body
        },
        function(err, reply) {
          if (err) {
            console.log(err && err.stack);
            return res.JSON({ err });
          }
          console.dir(reply);
          return res.json({
            reply,
            responseCode: 0,
            responseDesc: "Sucess"
          });
        }
      );
    });
  } catch (err) {
    console.log(err);
  }
};
