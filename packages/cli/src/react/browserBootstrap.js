// Used for browser bootstrapping the compiled components for the dev server
function browserBootstrap(code) {
  return `
  ${code}
  ReactDOM.hydrate(React.createElement(Page, window.__APP_INITIAL_STATE__, null), document.getElementById('root'));
`;
}

module.exports = browserBootstrap;
