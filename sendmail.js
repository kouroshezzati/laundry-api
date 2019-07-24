const sendmail = require('sendmail')({
  logger: {
    debug: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  },
  smtpPort: 25, // Default: 25
  smtpHost: 'localhost' // Default: -1 - extra smtp host after resolveMX
})

sendmail({
    from: 'no-reply@bubblesonline.nl',
    to: 'moslem.ezati@gmail.com',
    subject: 'test sendmail',
    html: 'Mail of test sendmail ',
  }, function(err, reply) {
    console.log(err && err.stack);
    console.dir(reply);
});
