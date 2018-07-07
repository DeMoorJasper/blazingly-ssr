#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');

const build = require('./commands/build');
const serve = require('./commands/serve');
const productionServe = require('./commands/productionServe');

program.version(pkg.version, '-v, --version');

program
  .command('build <dir>')
  .option('--out-dir', 'Define the directory where the output will be saved /.blazingly/dist/')
  .option('--no-cache', 'Disable the cache')
  .action(build);

program
  .command('serve <dir>')
  .option('--out-dir', 'Define the directory where the output will be saved, defaults to /.blazingly/serve/')
  .option('--no-cache', 'Disable the cache')
  .option('--port', 'Set a custom port for the server')
  .option('--no-source-maps', 'Disable the sourcemaps')
  .action(serve);

program
  .command('prod-serve [dir]')
  .option('--port', 'Set a custom port for the server')
  .action(productionServe);

program.parse(process.argv);