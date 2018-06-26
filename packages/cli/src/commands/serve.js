const path = require('path');

// Local requires
const cliOptions = require('../options');
const build = require('../functions/build');
const logger = require('../logger');
const Server = require('../functions/Server');

function cleanOptions(dir, options) {
  return {
    inputDir: path.join(process.cwd(), dir),
    outDir: options.outDir,
    cache: options.cache,
    sourceMaps: options.sourceMaps === false ? false : true,
    port: 1234
  };
}

async function serve(dir, options = {}) {
  options = cleanOptions(dir, options);
  
  let outDir = path.join(process.cwd(), options.outDir || '.blazingly/serve');
  let bundledPath = await build(options.inputDir, {
    production: false,
    outDir,
    cache: options.cache,
    sourceMaps: options.sourceMaps,
    watch: true,
    rebuildTrigger: () => {
      // Rebuild listener
    }
  });

  logger.persistSpinner(logger.emoji.success, `Build finished, watching for changes...`, 'green');

  logger.updateSpinner('Starting server...');
  let server = new Server({ outDir });
  await server.start(options.port);
  logger.persistSpinner(logger.emoji.success, `Server listening on port ${options.port}.`, 'green');
}

module.exports = serve;