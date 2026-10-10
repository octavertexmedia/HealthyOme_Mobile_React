/* global __dirname */
const fs = require('node:fs/promises');
const path = require('node:path');

const hook = 'useDevSupport = BuildConfig.DEBUG && !assets.list("").orEmpty().contains("index.android.bundle"),';

function addStandaloneHook(source) {
  if (source.includes(hook)) return source;
  if (/\buseDevSupport\s*=/.test(source)) throw new Error('MainApplication has a custom useDevSupport setting. Review it before preparing a standalone build.');
  const anchor = /ExpoReactHostFactory\.getDefaultReactHost\((\r?\n)([ \t]*)context = applicationContext,/g;
  const matches = [...source.matchAll(anchor)];
  if (matches.length !== 1) throw new Error('Expected exactly one supported MainApplication React host. Native template changed; review it before building.');
  return source.replace(anchor, (match, newline, indent) => `${match}${newline}${indent}// Bundled local test APKs must boot without a JavaScript development server.${newline}${indent}${hook}`);
}

async function prepareStandaloneAndroid(projectRoot = path.resolve(__dirname, '..')) {
  const config = JSON.parse(await fs.readFile(path.join(projectRoot, 'app.json'), 'utf8'));
  const packageName = config.expo?.android?.package;
  if (typeof packageName !== 'string' || !/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+$/.test(packageName)) throw new Error('A valid Android package is required in app.json.');
  const target = path.join(projectRoot, 'android/app/src/main/java', ...packageName.split('.'), 'MainApplication.kt');
  let source;
  try { source = await fs.readFile(target, 'utf8'); }
  catch (error) { throw new Error(`Generated MainApplication is unavailable at ${target}. Prepare the native project first; nothing was installed or generated.`, { cause: error }); }
  const updated = addStandaloneHook(source);
  if (updated !== source) await fs.writeFile(target, updated);
  return { target, changed: updated !== source };
}

module.exports = { addStandaloneHook, prepareStandaloneAndroid };
if (require.main === module) {
  prepareStandaloneAndroid().then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
