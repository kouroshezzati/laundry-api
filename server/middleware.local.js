var whitelist = [
  "https://bubblesonline.nl",
  "http://www.bubblesonline.nl",
  "http://145.131.3.166"
];

module.exports = {
  initial: {
    cors: {
      params: {
        origin: function(origin, callback) {
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
