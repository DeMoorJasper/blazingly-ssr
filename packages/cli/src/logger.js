const ora = require('ora');
const chalk = require('chalk');
const emoji = require('./utils/emoji');

let spinner;

function updateSpinner(text, color) {
  if (color) {
    text = chalk[color](text);
  }

  if (!spinner) {
    spinner = ora(text);
  }

  spinner.text = text;

  startSpinner();
}

function stopSpinner() {
  if (spinner) {
    spinner.stop();
  }
}

function startSpinner() {
  if (spinner && !spinner.isSpinning) {
    spinner.start();
  }
}

function persistSpinner(symbol, text, color) {
  if (color) {
    text = chalk[color](text);
  }

  if (spinner) {
    spinner.stopAndPersist({symbol, text});
  } else {
    log(text);
  }
}

function log(text) {
  console.log(text);
}

function warn(text) {
  console.warn(`${emoji.warning} ${chalk['yellow'](text)}`);
}

function error(error) {
  console.error(`${emoji.error} ${chalk['red'](error.message)}`);
  console.error(error);
}

exports.updateSpinner = updateSpinner;
exports.stopSpinner = stopSpinner;
exports.startSpinner = startSpinner;
exports.persistSpinner = persistSpinner;
exports.log = log;
exports.warn = warn;
exports.error = error;
exports.emoji = emoji;
