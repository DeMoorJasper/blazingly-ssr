const path = require('path');

// Local requires
const logger = require('../logger');
const Server = require('@blazingly/server').Server;

function cleanOptions(dir, options) {
  return {
    outDir: dir,
    port: options.port || 1234
  };
}

async function serve(dir, options = {}) {
  options = cleanOptions(dir, options);

  let outDir = path.join(process.cwd(), options.outDir || '.blazingly/dist');

  logger.updateSpinner('Starting server...');
  let server = new Server({outDir, port: options.port});
  await server.start();
  logger.persistSpinner(logger.emoji.success, `Server listening on port ${options.port}.`, 'green');
}

module.exports = serve;
