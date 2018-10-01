// NPM Modules
const express = require('express');

// Local modules
const middleware = require('./middleware');

class Server {
  constructor(options) {
    this.middleware = middleware(options);
    this.port = options.port || 1234;
  }

  async start() {
    if (!this.server) {
      this.server = express();
      this.server.use(this.middleware);
      await new Promise(resolve => this.server.listen(this.port, resolve));
    }
  }
}

module.exports = Server;
