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
      return res.status(500).json({ message: "Please select captcha" });
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
    console.log("request will start", verificationUrl);
    request(verificationUrl, function(error, response, body) {
      body = JSON.parse(body);
      console.log("the request body is:", body);
      // Success will be true or false depending upon captcha validation.
      if (body.success !== undefined && !body.success) {
        return res.status(500).json(error);
      }
      sendmail(
        {
          from: req.body.email,
          to: "info@bubblesonline.nl",
          subject: req.body.subject,
          body: req.body.name + ": " + req.body.body
        },
        function(err, reply) {
          if (err) {
            console.log(err && err.stack);
            return res.json({ err });
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
