// Node modules
const vm = require('vm');
const {EventEmitter} = require('events');

// NPM modules
const {JSDOM} = require('jsdom');

// Local modules
const moduleBootstrap = require('./moduleBootstrap');

const noop = () => {};

const CONSOLE_NOOPS = [
  'debug',
  'error',
  'info',
  'log',
  'warn',
  'dir',
  'dirxml',
  'table',
  'trace',
  'group',
  'groupCollapsed',
  'groupEnd',
  'clear',
  'count',
  'assert',
  'markTimeline',
  'profile',
  'profileEnd',
  'timeline',
  'timelineEnd',
  'time',
  'timeEnd',
  'timeStamp',
  'context',
  'memory'
];
let noopConsole = {};
for (let f of CONSOLE_NOOPS) {
  noopConsole[f] = noop;
}

class RenderSandbox extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
  }

  emitError(error) {
    this.emit('error', error);
  }

  preRender(script) {
    let code = moduleBootstrap(script, this.options);

    const virtualWindow = new JSDOM('');

    // Catches some errors and could add a layer of security in some cases (if it would have a whitelist)
    function mockRequire(...args) {
      if (!Array.isArray(args) || args.length === 0) {
        return;
      }

      if (Array.isArray(this.options.whitelist) && this.options.whitelist.indexOf(args[0]) === -1) {
        this.emitError(new Error('Script in sandbox tried to access a non-whitelisted require!'));
        return null;
      }

      try {
        return require(...args);
      } catch (error) {
        this.emitError(error);
      }
    }

    let ctx = Object.assign(virtualWindow, {
      sandboxRequire: mockRequire.bind(this),
      require: mockRequire.bind(this),
      console: this.options.noopConsole ? noopConsole : console
    });

    vm.createContext(ctx);
    vm.runInContext(code, ctx);

    return ctx;
  }
}

module.exports = RenderSandbox;
