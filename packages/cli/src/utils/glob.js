const glob = require('glob');

module.exports = async (...args) => {
  return new Promise((resolve, reject) => {
    glob(...args, (err, files) => {
      if (err) {
        return reject(err);
      }
      return resolve(files);
    });
  });
};
