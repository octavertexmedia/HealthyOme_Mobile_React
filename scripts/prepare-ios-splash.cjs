/* global __dirname */
// Generated native directories are ignored. Reuse original pixels before Xcode,
// without Expo CLI, image transformation, icon changes or dependency installation.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const originalHash = 'e2d5933eb2f58837188667deb20e388aa7a3032f0ee162c67076328570f0db32';
const stockHashes = {
  'image.png': 'e7d5eef4f96a64957efdb9c8fdaffbac8d02e1db43024f4176edece7b334d359',
  'image@2x.png': '4d2685552a55f0cff914d1ad7409e5fc48f796c5f11080eb0bebcf8c708ee472',
  'image@3x.png': '262a5fa2d3b5083c3cab3f67302459d4b7a1588a29df85b079f8036643c31610',
};
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function boundSplashStoryboard(xml) {
  if (xml.includes('id="HealthyOmeSplashWidth"') && xml.includes('id="HealthyOmeSplashHeight"')) return xml;
  const target = /(<imageView id="EXPO-SplashScreen"[^>]*contentMode="scaleAspectFit"[^>]*>\s*<rect[^>]*\/>)(\s*<\/imageView>)/;
  if (!target.test(xml)) throw new Error('Unknown storyboard splash layout; nothing changed.');
  return xml.replace(target, '$1\n                                <constraints>\n                                    <constraint firstAttribute="width" constant="200" id="HealthyOmeSplashWidth"/>\n                                    <constraint firstAttribute="height" constant="200" id="HealthyOmeSplashHeight"/>\n                                </constraints>$2');
}
async function main() {
  const source = path.join(root, 'assets/images/branding/healthyome-logo.png');
  if (hash(await fs.readFile(source)) !== originalHash) throw new Error('Original brand image changed; inspect before replacing native splash.');
  const directory = path.join(root, 'ios/HealthyOMe/Images.xcassets/SplashScreenLogo.imageset');
  const storyboard = path.join(root, 'ios/HealthyOMe/SplashScreen.storyboard');
  const originalStoryboard = await fs.readFile(storyboard, 'utf8');
  const boundedStoryboard = boundSplashStoryboard(originalStoryboard);
  const contents = JSON.parse(await fs.readFile(path.join(directory, 'Contents.json'), 'utf8'));
  const files = contents.images.map((image) => image.filename).sort();
  if (JSON.stringify(files) !== JSON.stringify(Object.keys(stockHashes).sort())) throw new Error('Unexpected native splash layout; nothing changed.');
  for (const name of files) {
    const current = hash(await fs.readFile(path.join(directory, name)));
    if (current !== stockHashes[name] && current !== originalHash) throw new Error(`Custom splash ${name} found; nothing changed.`);
  }
  for (const name of files) await fs.copyFile(source, path.join(directory, name));
  if (boundedStoryboard !== originalStoryboard) await fs.writeFile(storyboard, boundedStoryboard);
  console.log(JSON.stringify({ nativeSplash: 'original HealthyOMe logo', sha256: originalHash, files: files.length, transformed: false, iconsChanged: false, viewSize: '200 x 200 points, aspect fit' }));
}
module.exports = { boundSplashStoryboard };
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
