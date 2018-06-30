// Node modules
const url = require('url');
const path = require('path');

// NPM Modules
const fs = require('fs-extra');
const mime = require('mime');

function registerMiddleware(options) {
  return async function middleware(req, res, next) {
    let parsedUrl = url.parse(req.url);
    try {
      let filePath = path.join(options.outDir, parsedUrl.pathname);
      let fileContent = (await fs.readFile(filePath)).toString();
      let contentType = mime.getType(path.extname(filePath).substring(1));
  
      res.status(200);
      res.set('Content-Type', contentType);
      return res.send(fileContent);
    } catch (e) {
      res.status(404);
      res.set('Content-Type', 'text/plain');
      res.send('File not found.');
    }
  }
}

module.exports = registerMiddleware;