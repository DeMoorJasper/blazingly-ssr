function moduleBootstrap(code, options) {
  return `
    const React = sandboxRequire('react');
    ${
      options.stream
        ? "const renderToNodeStream = sandboxRequire('react-dom/server').renderToNodeStream;"
        : "const renderToString = sandboxRequire('react-dom/server').renderToString;"
    }
    ${code}
    render = function(props) {
      if (Page.default) {
        Page = Page.default;
      }
      return ${options.stream ? 'renderToNodeStream' : 'renderToString'}(React.createElement(Page, props));
    };
  `;
}

module.exports = moduleBootstrap;
