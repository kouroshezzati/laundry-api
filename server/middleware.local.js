var whitelist = [
  "https://bubblesonline.nl",
  "https://www.bubblesonline.nl",
  "https://145.131.3.166"
];

module.exports = {
  initial: {
    cors: {
      params: {
        origin: function(origin, callback) {
		console.log('the origin is', origin);
          if (whitelist.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        }
      }
    }
  }
};
