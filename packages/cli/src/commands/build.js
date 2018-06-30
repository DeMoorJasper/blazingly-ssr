const path = require('path');

// Local requires
const build = require('../functions/build');
const logger = require('../logger');

function cleanOptions(dir, options) {
  return {
    inputDir: path.join(process.cwd(), dir),
    outDir: options.outDir,
    cache: options.cache,
    sourceMaps: false
  };
}

async function deploy(dir, options = {}) {
  options = cleanOptions(dir, options);
  
  let outDir = path.join(process.cwd(), options.outDir || '.blazingly/dist');
  let bundledPath = await build(options.inputDir, {
    production: true,
    outDir,
    cache: options.cache,
    sourceMaps: options.sourceMaps
  });

  logger.persistSpinner(logger.emoji.success, `Build saved in ${bundledPath}`, 'green');
}

module.exports = deploy;