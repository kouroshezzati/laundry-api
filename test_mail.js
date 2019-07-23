var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
  host: "mail.bubblesonline.nl",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "mosl3m", // generated ethereal user
    pass: `RmAX#aeY/47{upVQ~}!L*h)GxN;n'JjM5cB86rfkU&[d9PDw%_`
  }
});
var mailOptions = {
  from: "mosl3m@bubblesonline.nl",
  to: "moslem.ezati@gmail.com",
  subject: "Sending Email using Node.js",
  text: "That was easy!"
};
transporter.sendMail(mailOptions, function(error, info) {
  if (error) {
    console.log(error);
  } else {
    console.log("Email sent: " + info.response);
  }
});
