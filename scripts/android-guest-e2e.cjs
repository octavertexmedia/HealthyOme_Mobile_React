/* global __dirname */
// Uses only existing ADB/Node. No installs, resets, OTP entry, retries or API writes.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const project = path.resolve(__dirname, '..');
const config = require('../app.json').expo;
const adb = process.env.HEALTHYOME_ADB || '/Users/manishkumar/Library/Android/sdk/platform-tools/adb';
const serial = process.env.HEALTHYOME_ANDROID_SERIAL;
const output = path.join(project, 'artifacts', 'e2e-guest');
const steps = [];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function command(args, binary = false) {
  return execFileSync(adb, ['-s', serial, ...args], { encoding: binary ? undefined : 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
}
const normalize = (value) => value.replace(/&#10;|\s+/g, ' ').trim();
function hasText(xml, text) { return normalize(xml).includes(text); }
const primary = { brands: 1, header: true, tabs: true };
const secondaryList = { brands: 0, header: false, tabs: true };
const detail = { brands: 0, header: false, tabs: false };
async function inspect(name, expected, chrome = primary) {
  await wait(3500);
  command(['shell', 'uiautomator', 'dump', '/sdcard/healthyome-guest-e2e.xml']);
  const xml = command(['shell', 'cat', '/sdcard/healthyome-guest-e2e.xml']);
  if (hasText(xml, 'Logout')) throw new Error('Authenticated content detected; no screenshot captured.');
  for (const text of expected) if (!hasText(xml, text)) throw new Error(`${name}: expected public UI text was not found: ${text}`);
  const brands = (xml.match(/content-desc="HealthyOme"/g) || []).length;
  if (brands !== chrome.brands) throw new Error(`${name}: expected ${chrome.brands} brand lockups, found ${brands}.`);
  const globalHeader = /content-desc="Select delivery location"/.test(xml);
  const tabs = /content-desc="Home"/.test(xml);
  if (globalHeader !== chrome.header) throw new Error(`${name}: global header does not match the route policy.`);
  if (tabs !== chrome.tabs) throw new Error(`${name}: bottom navigation does not match the route policy.`);
  fs.writeFileSync(path.join(output, `${name}.xml`), xml);
  fs.writeFileSync(path.join(output, `${name}.png`), command(['exec-out', 'screencap', '-p'], true));
  steps.push({ name, passed: true, expected, brandCount: brands, globalHeader, tabs });
}
function open(route) {
  command(['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `healthyome://${route}`, '-n', `${config.android.package}/.MainActivity`]);
}
async function main() {
  if (!serial || !fs.existsSync(adb)) throw new Error('Set HEALTHYOME_ANDROID_SERIAL and an existing HEALTHYOME_ADB path. Nothing will be installed.');
  if (!config.extra.readOnlyPreview) throw new Error('This runner only accepts the read-only preview configuration.');
  if (command(['get-state']).trim() !== 'device') throw new Error('The selected Android device is not ready. No retry performed.');
  fs.mkdirSync(output, { recursive: true });
  open('/');
  await inspect('home', ['HealthyOme', 'Snacks', 'Training', 'Orders', 'Dietitian']);
  open('snacks');
  await inspect('snacks', ['Healthy Snacks']);
  open('subscription/categories');
  await inspect('subscriptions', ['Subscription Meals', 'Pick a category'], secondaryList);
  open('subscription/plans/healthy-home-style-lunch-meals');
  await inspect('subscription-detail', ['Subscription Plans', 'Available menu', 'Customize plan'], detail);
  open('subscription/create?plan=healthy-home-style-lunch-meals');
  await inspect('subscription-customize', ['Customize plan', 'Plan duration', 'Checkout'], detail);
  open('cart');
  await inspect('cart', ['Cart'], detail);
  open('checkout');
  await inspect('checkout', ['Checkout'], detail);
  open('(tabs)/profile');
  await inspect('profile', ['Your Account', 'Guest'], secondaryList);
  open('functional-training');
  await inspect('training', ['Functional Training']);
  open('consult');
  await inspect('dietitian', ['Consult', 'Dietician']);
  open('product-review/snack/8');
  await inspect('review-login-boundary', ['Welcome', 'Phone'], { brands: 1, header: false, tabs: false });
  open('/');
  const report = { scope: 'public guest native smoke, not authenticated E2E', sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8' }).trim(), installedBinaryProvenance: 'Verify separately against the build report; source HEAD is not APK provenance.', serial, viewport: command(['shell', 'wm', 'size']).trim(), density: command(['shell', 'wm', 'density']).trim(), steps };
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
