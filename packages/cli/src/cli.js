#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');
const path = require('path');

const deploy = require('./commands/deploy');
const build = require('./commands/build');
const serve = require('./commands/serve');

program.version(pkg.version, '-v, --version');

program
  .command('deploy <dir>')
  .option('--no-cache', 'Disable the cache')
  .action(deploy);

program
  .command('build <dir>')
  .option('--out-dir', 'Define the directory where the output will be saved /.blazingly/dist/')
  .option('--no-cache', 'Disable the cache')
  .action(build);

program
  .command('serve <dir>')
  .option('--out-dir', 'Define the directory where the output will be saved, defaults to /.blazingly/serve/')
  .option('--no-cache', 'Disable the cache')
  .option('--no-source-maps', 'Disable the sourcemaps')
  .action(serve);

program.parse(process.argv);