/* global __dirname */
// Existing Chrome + built-in Node CDP. Blocks all non-GET/HEAD requests.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const { spawn } = require('node:child_process');
const chromePath = process.env.HEALTHYOME_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const width = 411;
const height = 914;
const referencePath = process.argv[2] || '/';
const referenceName = process.argv[3] || 'home';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function main() {
  if (!fs.existsSync(chromePath)) throw new Error('Chrome is not installed at the configured path; no download or retry performed.');
  if (!/^\/(?:subscription\/|checkout$|sidebar$|$)/.test(referencePath) || !/^[a-z0-9-]+$/.test(referenceName)) throw new Error('Only public same-origin reference routes and simple filenames are allowed.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'healthyome-web-reference-'));
  const out = path.resolve(__dirname, '../artifacts/mobile-web-reference');
  fs.mkdirSync(out, { recursive: true });
  const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let socket;
  try {
    await wait(2500);
    const portFile = path.join(profile, 'DevToolsActivePort');
    if (!fs.existsSync(portFile)) throw new Error('Chrome did not expose its local debugger. No retry performed.');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT', signal: AbortSignal.timeout(5000) })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let nextId = 1;
    const pending = new Map();
    function call(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out; no retry performed.`)); }, 15000);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params }));
      });
    }
    socket.addEventListener('message', ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.method === 'Fetch.requestPaused') {
        const method = ['GET', 'HEAD'].includes(msg.params.request.method) ? 'Fetch.continueRequest' : 'Fetch.failRequest';
        void call(method, { requestId: msg.params.requestId, ...(method === 'Fetch.failRequest' ? { errorReason: 'BlockedByClient' } : {}) }).catch(() => {});
      }
      const entry = pending.get(msg.id);
      if (entry) { clearTimeout(entry.timer); pending.delete(msg.id); if (msg.error) entry.reject(new Error(msg.error.message)); else entry.resolve(msg.result); }
    });
    await call('Page.enable');
    await call('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    await call('Page.navigate', { url: `https://healthyome.in${referencePath}` });
    await wait(8000);
    const screenshot = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, `${referenceName}-411x914.png`), Buffer.from(screenshot.data, 'base64'));
    const measured = await call('Runtime.evaluate', { returnByValue: true, expression: `JSON.stringify({url:location.href,viewport:{width:innerWidth,height:innerHeight},title:document.title,images:Array.from(document.images).filter(i=>/logo/i.test(i.currentSrc)).map(i=>({source:i.currentSrc,box:{x:i.getBoundingClientRect().x,y:i.getBoundingClientRect().y,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height},objectFit:getComputedStyle(i).objectFit})),navigation:Array.from(document.querySelectorAll('nav button')).map(b=>({label:b.getAttribute('aria-label'),text:b.textContent}))})` });
    const metrics = JSON.parse(measured.result.value);
    const structure = await call('Runtime.evaluate', { returnByValue: true, expression: `JSON.stringify({text:document.body.innerText,blocks:Array.from(document.querySelectorAll('h1,h2,h3,button')).filter(e=>e.getBoundingClientRect().width>0).map(e=>({tag:e.tagName,text:e.textContent,box:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}}))})` });
    fs.writeFileSync(path.join(out, `${referenceName}-metrics.json`), JSON.stringify({ ...metrics, structure: JSON.parse(structure.result.value) }, null, 2));
    console.log(JSON.stringify({ saved: out, viewport: metrics.viewport, title: metrics.title }));
  } finally { if (socket) socket.close(); chrome.kill('SIGTERM'); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
