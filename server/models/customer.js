"use strict";
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

module.exports = function(Customer) {
  Customer.on("resetPasswordRequest", function(info) {
    console.log(info.email); // the email of the requested user
    console.log(info.accessToken.id); // the temp access token to allow password reset
    sendmail(
      {
        from: "no-reply@bubblesonline.nl",
        to: info.email,
        subject: "reset password",
        html: `<div>Your reset link is: <a href="https://www.bubblesonline.nl/reset-password/?${
          info.accessToken.id
        }">here.</a></div>`
      },
      function(err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
      }
    );
  });
};
