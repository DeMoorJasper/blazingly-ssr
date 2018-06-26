// Node modules
const { JSDOM, VirtualConsole } = require('jsdom');
const vm = require('vm');

// Local requires
const logger = require('../logger');

function moduleBootstrap(code) {
  return `
    const React = sandboxRequire('react');
    const renderToString = sandboxRequire('react-dom/server').renderToString;
    ${code}
    render = function(props) {
      if (Page.default) {
        Page = Page.default;
      }
      return renderToString(React.createElement(Page, props));
    };
  `;
}

function preRender(script) {
  let code = moduleBootstrap(script);

  const virtualWindow = new JSDOM('');

  function mockRequire(...args) {
    try {
      return require(...args);
    } catch(e) {
      logger.error('An error occured in mockRequire.');
      logger.error(e);
    }
  }

  let ctx = Object.assign(virtualWindow, {
    sandboxRequire: mockRequire,
    require: mockRequire, // This shouldn't be necessary
    console
  });

  vm.createContext(ctx);
  vm.runInContext(code, ctx);

  return ctx;
}

module.exports = preRender;