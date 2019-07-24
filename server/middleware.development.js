module.exports = {
  initial: {
    cors: {
      params: {
        origin: true
      }
    }
  },
  "final:after": {
    "strong-error-handler": {
      params: {
        debug: true,
        log: true
      }
    }
  }
};
