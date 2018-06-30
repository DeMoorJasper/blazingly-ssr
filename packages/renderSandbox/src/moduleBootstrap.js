function moduleBootstrap(code, options) {
  return `
    const React = sandboxRequire('react');
    const renderToString = sandboxRequire('react-dom/server').renderToString;
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