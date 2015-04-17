module.exports = function (grunt, options) {
  return {
    options: {
      hostname: 'localhost',
      port: 3000
    },
    server: {
      options: {
        base: 'src',
        open: true
      }
    }
  };
};