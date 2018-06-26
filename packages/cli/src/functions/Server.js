// Node modules
const express = require('express');
const fs = require('fs-extra');
const url = require('url');
const path = require('path');
const mime = require('mime');

class Server {
  constructor({ outDir }) {
    this.outDir = outDir;
    this.middleware = this.middleware.bind(this);
  }

  async middleware(req, res, next) {
    let parsedUrl = url.parse(req.url);
    try {
      let filePath = path.join(this.outDir, parsedUrl.pathname);
      let fileContent = (await fs.readFile(filePath)).toString();
      let contentType = mime.getType(path.extname(filePath).substring(1));

      res.status(200);
      res.set('Content-Type', contentType);
      return res.send(fileContent);
    } catch(e) {
      res.status(404);
      res.set('Content-Type', 'text/plain');
      res.send('File not found.');
    }
  }

  async start(port = 1234) {
    if (!this.server) {
      this.server = express();
      this.server.use(this.middleware);
      this.port = port;
      await new Promise(resolve => this.server.listen(port, resolve));
    }
    return this.port;
  }
}

module.exports = Server;