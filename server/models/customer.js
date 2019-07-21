"use strict";

module.exports = function(Customer) {
  Customer.on("resetPasswordRequest", function(info) {
    console.log(info.email); // the email of the requested user
    console.log(info.accessToken.id); // the temp access token to allow password reset

    // requires AccessToken.belongsTo(User)
    info.accessToken.user(function(err, user) {
      console.log(user); // the actual user
    });
  });
};
