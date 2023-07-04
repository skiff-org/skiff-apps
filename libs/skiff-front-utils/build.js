/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const cp = require('child_process');

const fs = require('fs');
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const svgrPlugin = require('esbuild-plugin-svgr');

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
    'src/utils/walletUtils/isWalletEnabled.ts',
    'src/utils/storageUtils.ts',
    'src/utils/emailUtils/emailUtils.ts',
    'src/constants/index.ts',
    'src/hooks/useAsyncHCaptcha.tsx',
    'src/utils/mobileUtils.ts',
    'src/utils/getMailDomain.ts',
    'src/utils/recoveryUtils/recoveryUtils.ts',
    'src/theme/AppThemeProvider.tsx',
    'src/utils/documentUtils/docCryptoUtils.ts'
  ],
  bundle: true,
  splitting: format === 'esm',
  platform: 'node',
  format: format,
  outdir: `dist/${format}`,
  sourcemap: true,
  treeShaking: true,
  loader: {
    '.png': 'dataurl'
  },
  plugins: [nodeExternalsPlugin(), svgrPlugin()],
  watch: !!process.env.WATCH && {
    onRebuild(error) {
      if (error) {
        console.error(`Error while rebuilding ${format} for ${packagejson.name}:`, error);
      } else {
        console.log(`Rebuilt ${format} for ${packagejson.name}`);
      }
    }
  },
  minify: true,
  incremental: true,
  metafile: true
});

if (WATCH) {
  console.log(`Starting watch mode for ${packagejson.name}`);
}
Promise.all([
  esbuild.build(esbuildConf('cjs')),
  esbuild.build(esbuildConf('esm')),
  WATCH ? spawn('yarn tsc -b --preserveWatchOutput -w') : spawn('yarn tsc -b')
])
  .then(async (results) => {
    const [result1, result2] = results;
    const metafile1 = result1.metafile;
    const metafile2 = result2.metafile;
    // console.log(JSON.stringify(metafile1));
    // console.log('------------------');
    // console.log(JSON.stringify(metafile2));
    await fs.writeFile('./dist/metafile1.json', JSON.stringify(metafile1), () => {});
    await fs.writeFile('./dist/metafile2.json', JSON.stringify(metafile2), () => {});
    console.log(`Built ${packagejson.name}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(`Build for ${packagejson.name} failed:`, e);
    process.exit(1);
  });
