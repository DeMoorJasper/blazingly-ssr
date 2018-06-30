// Node modules
const path = require('path');

// Local requires
const RenderSandbox = require('@blazingly/render-sandbox');

// Used for critical css selection and snapshot rendering for dev server
async function snapshot({ page, cssBundles, jsBundles, isProduction }) {
  let pageData = await page.getPageData();
  jsBundles = jsBundles || page.getJSBundles();
  cssBundles = cssBundles || page.getCSSBundles();

  let metaData = '';
  if (pageData.header && pageData.header.meta && Array.isArray(pageData.header.meta)) {
    for (let metaItem of pageData.header.meta) {
      metaData += "<meta ";
      for (let key in metaItem) {
        metaData += `${key}="${metaItem[key]}" `;
      }
      metaData += ">";
    }
  }

  let properties = pageData.properties || {};

  let styles = `
    <style>
      /* BLAZINGLY INLINE CRITICAL CSS */
    </style>
  `;
  for (let css of cssBundles) {
    styles += `<link rel="stylesheet" type="text/css" href="/${path.relative(page.options.outDir, css)}">`;
  }

  let scripts = '';
  for (let js of jsBundles) {
    scripts += `<script src="/${path.relative(page.options.outDir, js)}" type="text/javascript"></script>`;
  }

  const header = `
    <html lang="${pageData.header ? pageData.header.language || 'en' : 'en'}">
    <head>
      <title>${pageData.header ? pageData.header.title : 'Hello world'}</title>
      ${metaData}
      ${styles}
      <script>window.__APP_INITIAL_STATE__ = ${JSON.stringify(properties)}</script>
    </head>
    <body>
      <div id="root">`;

  const footer = `
      </div>
      <script>
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/${path.relative(page.options.outDir, page.project.serviceWorker.path)}').then(() => {
              console.log('Service worker registered');
            }).catch(e => {
              console.log('Could not register the service worker');
            });
          });
        }
      </script>
      ${scripts}
    </body>
    </html>`;

  let renderSandbox = new RenderSandbox({
    noopConsole: true,
    stream: false
  });

  return header + renderSandbox.preRender(page.getRenderScript().content).render(properties) + footer;
}

module.exports = snapshot;