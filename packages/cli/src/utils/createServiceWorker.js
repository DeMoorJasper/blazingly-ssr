const fs = require('fs-extra');
const path = require('path');
const minify = require('./minifyJS');

async function generateSW({files, rootDir}) {
  const SW_TEMPLATE = (await fs.readFile(path.join(__dirname, './sw-template.js'))).toString();

  let filesArr = ['/offline'];
  for (let file of files) {
    filesArr.push('/' + path.relative(rootDir, file));
  }

  return minify(SW_TEMPLATE.replace('[/* BLAZINGLY INSERT ASSETS */]', JSON.stringify(filesArr)));
}

module.exports = generateSW;
