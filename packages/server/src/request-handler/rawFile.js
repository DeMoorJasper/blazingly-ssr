// Node modules
const path = require('path');

// NPM modules
const fs = require('fs-extra');
const mime = require('mime');

async function sendRawFile(req, res, parsedUrl, options) {
  let filePath = path.join(options.outDir, parsedUrl.pathname);

  let fileContent = (await fs.readFile(filePath)).toString();
  let contentType = mime.getType(path.extname(filePath).substring(1));

  res.status(200);
  res.set('Content-Type', contentType);
  return res.send(fileContent);
}

module.exports = sendRawFile;
