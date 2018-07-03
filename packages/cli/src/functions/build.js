// Node modules
const Bundler = require('parcel-bundler');
const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');

// Local requires
const Project = require('../project/Project');
const logger = require('../logger');
const getRootDir = require('../utils/getRootDir');

async function postProcessBundles({ project, parcelBundle, requestHandlerBundle }) {
  logger.updateSpinner('Processing bundles...');

  try {
    await project.updateRequestHandlerBundles(requestHandlerBundle);
    await project.postProcessParcelBundle(parcelBundle);
    await project.snapshotPages();
  } catch (e) {
    logger.stopSpinner();

    logger.error(`An error occured while post-processing the bundles.`);
    logger.error(e);

    let prompt = inquirer.createPromptModule();
    let promptResponse = await prompt([
      {
        type: 'confirm',
        message: 'Do you want to ignore this and continue deploying (probably not a good idea)?',
        name: 'continue'
      }
    ]);

    if (!promptResponse.continue) {
      logger.persistSpinner(logger.emoji.error, 'Deploy cancelled.', 'red');
      process.exit();
    }

    logger.startSpinner();
  }

  logger.persistSpinner(logger.emoji.success, 'Bundles processed!', 'green');
}

async function build(inputDir, buildOptions = { production: false }) {
  logger.updateSpinner('Bundling render-code...');

  // Gather files that need bundling
  let outDir = buildOptions.outDir || path.join(process.cwd(), '.blazingly/dist');
  let cacheDir = buildOptions.cacheDir || path.join(process.cwd(), '.blazingly/.parcel-cache');

  try {
    await fs.remove(outDir);
  } catch (e) {
    // Do nothing...
  }

  await fs.mkdirp(outDir);
  await fs.mkdirp(cacheDir);

  let project = new Project(inputDir, {
    outDir
  });
  await project.getGlobalCSS();
  await project.getPages();

  let entrypoints = project.getAllEntrypointPaths();
  let entryRootDir = getRootDir(entrypoints);

  let bundler = new Bundler(entrypoints, {
    outDir: path.join(outDir, path.relative(inputDir, entryRootDir)),
    cacheDir: cacheDir,
    publicUrl: path.join('/', path.relative(inputDir, entryRootDir)),
    watch: buildOptions.watch,
    cache: buildOptions.cache === undefined ? true : buildOptions.cache,
    logLevel: 2,
    target: 'browser',
    sourceMaps: buildOptions.sourceMaps || buildOptions.production ? false : true,
    production: buildOptions.production,
    minify: buildOptions.production,
    contentHash: buildOptions.production,
    autoinstall: false
  });

  let requestHandlers = (await project.getAllRequestHandlers())
    .map(requestHandler => requestHandler.entry);

  entryRootDir = getRootDir(requestHandlers);

  let requestHandlerBundler = new Bundler(requestHandlers, {
    outDir: path.join(outDir, path.relative(inputDir, entryRootDir)),
    cacheDir: cacheDir,
    publicUrl: path.join('/', path.relative(inputDir, entryRootDir)),
    watch: buildOptions.watch,
    cache: buildOptions.cache === undefined ? true : buildOptions.cache,
    logLevel: 2,
    target: 'node',
    sourceMaps: buildOptions.sourceMaps || buildOptions.production ? false : true,
    production: buildOptions.production,
    minify: buildOptions.production,
    contentHash: buildOptions.production,
    autoinstall: false
  });

  let parcelBundle, requestHandlerBundle;

  const postProcess = async () => {
    if (requestHandlerBundle && parcelBundle) {
      await postProcessBundles({ project, parcelBundle, requestHandlerBundle });
      if (buildOptions.buildTrigger && typeof buildOptions.buildTrigger === 'function') {
        buildOptions.buildTrigger();
      }
    }
  }

  bundler.on('bundled', bundle => {
    logger.persistSpinner(logger.emoji.success, 'Bundled render-code!', 'green');
    parcelBundle = bundle;
    postProcess();
  });

  bundler.on('buildError', error => {
    logger.error(error);
  });

  requestHandlerBundler.on('bundled', bundle => {
    logger.persistSpinner(logger.emoji.success, 'Request handlers bundled!', 'green');
    requestHandlerBundle = bundle;
    postProcess();
  });

  requestHandlerBundler.on('buildError', error => {
    logger.error(error);
  });

  await bundler.bundle();
  await requestHandlerBundler.bundle();

  return outDir;
}

module.exports = build;