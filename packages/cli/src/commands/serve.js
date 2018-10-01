const path = require('path');

// Local requires
const build = require('../functions/build');
const logger = require('../logger');
const Server = require('@blazingly/server').Server;

function cleanOptions(dir, options) {
  return {
    inputDir: path.join(process.cwd(), dir),
    outDir: options.outDir,
    cache: options.cache,
    sourceMaps: options.sourceMaps === false ? false : true,
    port: options.port || 1234
  };
}

async function serve(dir, options = {}) {
  options = cleanOptions(dir, options);

  let outDir = path.join(process.cwd(), options.outDir || '.blazingly/serve');

  let server;
  await build(options.inputDir, {
    production: false,
    outDir,
    cache: options.cache,
    sourceMaps: options.sourceMaps,
    watch: true,
    buildTrigger: async () => {
      logger.persistSpinner(logger.emoji.success, `Build finished, watching for changes...`, 'green');

      if (!server) {
        logger.updateSpinner('Starting server...');
        server = new Server({outDir, port: options.port});
        await server.start();
        logger.persistSpinner(logger.emoji.success, `Server listening on port ${options.port}.`, 'green');
      }
    }
  });
}

module.exports = serve;
