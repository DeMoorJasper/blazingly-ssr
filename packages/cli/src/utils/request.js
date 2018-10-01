const request = require('request');

exports.post = async (...args) => {
  return new Promise((resolve, reject) => {
    request.post(...args, (err, httpResponse, body) => {
      if (err) {
        return reject(err);
      }
      return resolve({httpResponse, body});
    });
  });
};

exports.put = async (...args) => {
  return new Promise((resolve, reject) => {
    request.put(...args, (err, httpResponse, body) => {
      if (err) {
        return reject(err);
      }
      return resolve({httpResponse, body});
    });
  });
};

exports.request = async (...args) => {
  return new Promise((resolve, reject) => {
    request(...args, (err, httpResponse, body) => {
      if (err) {
        return reject(err);
      }
      return resolve({httpResponse, body});
    });
  });
};
