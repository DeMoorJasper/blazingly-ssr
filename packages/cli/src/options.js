const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const tempFolder = path.join(os.tmpdir(), '.blazingly');
fs.mkdirp(tempFolder);

module.exports = {
  deployServer: 'http://localhost:2000',
  tempFolder
}