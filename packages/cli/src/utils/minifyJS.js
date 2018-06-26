const terser = require('terser');

const OPTIONS = {
  mangle: {
    toplevel: true,
  },
  compress: {
    drop_console: true,
    ecma: 5 // IE11 Ugh...
  }
};

// Async for future upgradability
// in case we would multi-thread this or uglify would use anything async
async function minify(code) {
  let result = terser.minify(code, OPTIONS);
  return result.code;
}

module.exports = minify;