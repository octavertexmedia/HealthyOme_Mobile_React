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
let latestXml = '';
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
  latestXml = xml;
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
function bounds(label) {
  const node = latestXml.match(/<node\b[^>]*>/g)?.find((item) => item.includes(`content-desc="${label}"`) || item.includes(`text="${label}"`));
  const match = node?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  if (!match) throw new Error(`Native control not found: ${label}. No retry performed.`);
  const [, x1, y1, x2, y2] = match.map(Number);
  if (x2 <= x1 || y2 <= y1) throw new Error(`Native control is outside the viewport: ${label}.`);
  return { x: Math.round((x1 + x2) / 2), y: Math.round((y1 + y2) / 2), node };
}
function tap(label) { const { x, y } = bounds(label); command(['shell', 'input', 'tap', String(x), String(y)]); }
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
  tap('View day-wise menu schedule');
  await inspect('menu-sheet-from-button', ['Day-wise menu', 'India time', 'All published dates', 'Close day-wise menu'], detail);
  // Read the actual native label: Hermes and desktop ICU may differ in punctuation.
  const dateLabel = latestXml.match(/content-desc="((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[^"<>]+\d{4})"/)?.[1];
  if (!dateLabel) throw new Error('No visible native date choice was found. No retry performed.');
  tap(dateLabel);
  await inspect('menu-sheet-selected-date', ['Day-wise menu', dateLabel], detail);
  tap('Close day-wise menu');
  await inspect('menu-sheet-close', ['Subscription Plans', 'Available menu', 'Customize plan'], detail);
  tap('View day-wise menu schedule');
  await inspect('menu-sheet-reopen', ['Day-wise menu', dateLabel], detail);
  if (!bounds(dateLabel).node.includes('selected="true"')) throw new Error('Menu date selection was lost on reopening.');
  command(['shell', 'input', 'keyevent', '4']);
  await inspect('menu-sheet-back', ['Subscription Plans', 'Available menu', 'Customize plan'], detail);
  tap('View day-wise menu schedule');
  await inspect('menu-sheet-before-swipe', ['Day-wise menu'], detail);
  const drag = bounds('Day-wise menu');
  command(['shell', 'input', 'swipe', String(drag.x), String(drag.y), String(drag.x), String(drag.y + 450), '450']);
  await inspect('menu-sheet-swipe', ['Subscription Plans', 'Available menu', 'Customize plan'], detail);
  tap('View day-wise menu schedule');
  await inspect('menu-sheet-after-swipe-reopen', ['Day-wise menu'], detail);
  command(['shell', 'input', 'tap', '40', '100']);
  await inspect('menu-sheet-backdrop', ['Subscription Plans', 'Available menu', 'Customize plan'], detail);
  open('subscription/menu/healthy-home-style-lunch-meals');
  await inspect('date-wise-menu', ['Day-wise menu', 'India time', 'All published dates', 'Lunch'], detail);
  open('subscription/create?plan=healthy-home-style-lunch-meals');
  await inspect('subscription-customize', ['Customize plan', 'Plan duration', 'Checkout'], detail);
  open('cart');
  await inspect('cart', ['Cart'], detail);
  open('checkout');
  await inspect('checkout', ['Checkout'], detail);
  open('profile');
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
