// Check if the renderer and main bundles are built
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line import/no-extraneous-dependencies
import chalk from 'chalk';

const mainPath = path.join(__dirname, '..', '..', 'app', 'main.prod.js');
const rendererPath = path.join(__dirname, '..', '..', 'app', 'dist', 'renderer.prod.js');

if (!fs.existsSync(mainPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold('The main process is not built yet. Build it by running "yarn build-main"')
  );
}

if (!fs.existsSync(rendererPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold('The renderer process is not built yet. Build it by running "yarn build-renderer"')
  );
}
