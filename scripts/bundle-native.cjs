/* global __dirname */
const fs = require('node:fs/promises');
const { Buffer } = require('node:buffer');
const path = require('node:path');
const Metro = require('metro');
const { loadConfig } = require('metro-config');
const { prepareStandaloneAndroid } = require('./prepare-standalone-android.cjs');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  process.chdir(projectRoot);
  process.env.NODE_ENV = 'production';
  const platform = process.argv[2] || 'android';
  if (!['android', 'ios'].includes(platform)) throw new Error('Use android or ios.');
  if (platform === 'android') await prepareStandaloneAndroid(projectRoot);
  const destination = path.join(projectRoot, 'artifacts', 'bundled', platform);
  const bundleOutput = path.join(destination, 'assets', platform === 'android' ? 'index.android.bundle' : 'main.jsbundle');
  await fs.mkdir(path.dirname(bundleOutput), { recursive: true });
  const config = await loadConfig({ cwd: projectRoot, config: path.join(projectRoot, 'metro.config.js'), maxWorkers: 4 });
  config.resolver.useWatchman = false;
  const result = await Metro.runBuild(config, {
    entry: 'node_modules/expo-router/entry.js', platform, dev: false, minify: true,
    assets: true, bundleOut: bundleOutput, sourceMap: false,
    customTransformOptions: { routerRoot: 'app', engine: 'hermes', asyncRoutes: false },
    unstable_transformProfile: 'hermes-stable',
  });
  if (!result.assets || !result.code) throw new Error('The JavaScript bundle or assets are missing.');
  const cliRoot = path.dirname(require.resolve('@react-native/community-cli-plugin'));
  const saveAssets = require(path.join(cliRoot, 'commands/bundle/saveAssets.js')).default;
  await saveAssets(result.assets, platform, path.join(destination, platform === 'android' ? 'res' : 'assets'));
  console.log(JSON.stringify({ platform, bundleOutput, bundleBytes: Buffer.byteLength(result.code), assets: result.assets.length }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
