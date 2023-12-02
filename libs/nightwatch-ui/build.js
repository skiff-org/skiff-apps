/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const cp = require('child_process');

const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const svgrPlugin = require('esbuild-plugin-svgr');
const { sassPlugin } = require('esbuild-sass-plugin');

const packagejson = require('./package.json');
const spawn = (command, args) => {
  const childProcess = cp.spawn(command, args, {
    shell: true,
    stdio: 'inherit'
  });
  return new Promise((resolve, reject) => {
    childProcess.once('exit', (code) => {
      if (code !== 0) {
        return reject();
      }
      return resolve();
    });
    childProcess.once('error', (err) => reject(err));
  });
};

const WATCH = !!process.env.WATCH;

const esbuildConf = (format) => ({
  entryPoints: [
    'src/index.ts',
    'src/theme/index.ts',
    'src/components/Divider/index.ts',
    'src/components/Tabs/index.ts',
    'src/components/Tooltip/index.ts',
    'src/components/Typography/index.ts',
    'src/components/Toggle/index.ts',
    'src/components/InputField/index.ts',
    'src/components/Button/index.ts',
    'src/components/Icons/index.ts',
    'src/components/CodeInput/index.ts',
    'src/components/CircularProgress/index.ts'
  ],
  splitting: format === 'esm',
  bundle: true,
  platform: 'node',
  format: format,
  outdir: `dist/${format}`,
  sourcemap: true,
  treeShaking: true,
  minify: true,
  plugins: [nodeExternalsPlugin(), svgrPlugin(), sassPlugin()],
  watch: !!process.env.WATCH && {
    onRebuild(error) {
      if (error) {
        console.error(`Error while rebuilding ${format} for ${packagejson.name}:`, error);
      } else {
        console.log(`Rebuilt ${format} for ${packagejson.name}`);
      }
    }
  },
  incremental: true
});

if (WATCH) {
  console.log(`Starting watch mode for ${packagejson.name}`);
}

Promise.all([
  esbuild.build(esbuildConf('cjs')),
  esbuild.build(esbuildConf('esm')),
  WATCH ? spawn('yarn tsc -b --preserveWatchOutput -w') : spawn('yarn tsc -b')
])
  .then(() => {
    console.log(`Built ${packagejson.name}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(`Build for ${packagejson.name} failed:`, e);
    process.exit(1);
  });
