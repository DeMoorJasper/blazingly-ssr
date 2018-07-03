// Node modules
const path = require('path');

// NPM modules
const fs = require('fs-extra');
const RenderSandbox = require('@blazingly/render-sandbox');

let renderSandbox = new RenderSandbox({
  noopConsole: true,
  stream: true
});

let rootBundlePaths;
let pageBundlePaths = {};

function getPageName(url) {
  if (url === '/' || url === '') {
    return '.root';
  }
  return url.substring(1);
}

async function preRender(req, res, parsedUrl, options) {
  let pageName = getPageName(parsedUrl.pathname);
  let pageFolder = path.join(options.outDir, pageName);

  if (!rootBundlePaths) {
    try {
      rootBundlePaths = JSON.parse(await fs.readFile(path.join(options.outDir, 'bundlePaths.json'), 'utf-8'));
    } catch(e) {
      rootBundlePaths = {};
    }
  }

  if (!pageBundlePaths[pageName]) {
    try {
      pageBundlePaths[pageName] = JSON.parse(await fs.readFile(path.join(pageFolder, 'bundlePaths.json'), 'utf-8'));
    } catch(e) {
      pageBundlePaths[pageName] = {};
    }
  }

  let pageData;
  try {
    pageData = JSON.parse(await fs.readFile(path.join(pageFolder, 'pageData.json'), 'utf-8'));
  } catch (e) {
    pageData = {};
  }

  pageData.page = pageName;
  
  try {
    pageData.criticalCSS = await fs.readFile(path.join(pageFolder, 'critical.css'), 'utf-8');
  } catch (e) {
    pageData.criticalCSS = '';
  }
  
  pageData.criticalScripts = [];

  pageData.nonCriticalScripts = [];
  if (rootBundlePaths['js']) {
    pageData.nonCriticalScripts = pageData.nonCriticalScripts.concat(rootBundlePaths['js']);
  }
  if (pageBundlePaths[pageName]['js']) {
    pageData.nonCriticalScripts = pageData.nonCriticalScripts.concat(pageBundlePaths[pageName]['js']);
  }

  pageData.nonCriticalStyles = [];
  if (rootBundlePaths['css']) {
    pageData.nonCriticalStyles = pageData.nonCriticalStyles.concat(rootBundlePaths['css']);
  }
  if (pageBundlePaths[pageName]['css']) {
    pageData.nonCriticalStyles = pageData.nonCriticalStyles.concat(pageBundlePaths[pageName]['css']);
  }

  pageData.properties = pageData.properties || {};

  res.status(200);
  res.set('Content-Type', 'text/html; charset=utf-8');

  let script = await fs.readFile(path.join(pageFolder, 'js/App.js'), 'utf-8');

  await new Promise(resolve => {
    writeHeader(res, pageData);

    // Stream html from React pre-render to express
    const stream = renderSandbox.preRender(script).render(pageData.properties);

    stream.once('end', () => {
      writeFooter(res, pageData);
      resolve();
    });

    stream.on('error', e => {
      // Cleanly close stream
      stream.unpipe(res);
      stream.destroy();

      // Send result
      res.end('Failed to render the page.');

      // Resolve
      resolve();
    });

    stream.pipe(res);
  });
}

function writeHeader(res, pageData) {
  let metaData = '';
  if (pageData.header && Array.isArray(pageData.header.meta)) {
    for (let metaItem of pageData.header.meta) {
      metaData += "<meta ";
      for (let key in metaItem) {
        metaData += `${key}="${metaItem[key]}" `;
      }
      metaData += ">\n";
    }
  }

  let preloadScripts = '';
  for (let script of pageData.criticalScripts) {
    preloadScripts += `<link rel="preload" href="${script}" as="script">`;
  }

  let deferredStyles = '<noscript>';
  for (let style of pageData.nonCriticalStyles) {
    deferredStyles += `<link rel="stylesheet" type="text/css" href="${style}" />`
  }
  deferredStyles += '</noscript>';

  res.write(`
    <html lang="${pageData.header ? pageData.header.language || 'en' : 'en'}">
    <head>
      <title>${pageData.header ? pageData.header.title : ''}</title>
      ${metaData}
      <link rel="manifest" href="/assets/manifest/${pageData.page}/manifest.json">
      <script>window.__APP_INITIAL_STATE__ = ${JSON.stringify(pageData.properties)}</script>
      <style>
        ${pageData.criticalCSS}
      </style>
      ${deferredStyles}
      ${preloadScripts}
    </head>
    <body>
      <div id="root">`);
}

function writeFooter(res, pageData) {
  res.end(`</div>
          <script>
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').then(() => {
                  console.log('Service worker registered');
                }).catch(e => {
                  console.log('Could not register the service worker');
                });
              });
            }
            
            function createScriptTag(url) {
              var scriptTag = document.createElement('script');
              scriptTag.src = url;
              if (scriptTag.readyState) {
                scriptTag.onreadystatechange = writeNonCritical;
              } else {
                scriptTag.onload = writeNonCritical;
              }
              document.body.appendChild(scriptTag);
            }

            function createStyleTag(url) {
              var styleTag = document.createElement('link');
              styleTag.rel = "stylesheet";
              styleTag.type = "text/css";
              styleTag.href = url;
              document.head.appendChild(styleTag);
            }
            
            let loadedScripts = 0;
            var styles = ${JSON.stringify(pageData.nonCriticalStyles)};
            var criticalScripts = ${JSON.stringify(pageData.criticalScripts)};
            var nonCriticalScripts = ${JSON.stringify(pageData.nonCriticalScripts)};

            styles.forEach(function(url) {
              createStyleTag(url);
            });
            
            criticalScripts.forEach(function(url) {
              createScriptTag(url);
            });
            
            function writeNonCritical() {
              loadedScripts++;
              if (loadedScripts !== criticalScripts.length) {
                return;
              }
              nonCriticalScripts.forEach(function(url) {
                createScriptTag(url);
              });
            }
          </script>
        </body>
      </html>
    `);
}

module.exports = preRender;