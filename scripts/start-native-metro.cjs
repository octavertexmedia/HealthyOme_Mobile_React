/* global __dirname */
const path = require('node:path');

function rewriteNativeRequestUrl(requestUrl, rewrite = (url) => url) {
  const url = new URL(requestUrl, 'http://127.0.0.1:8081');
  url.pathname = url.pathname.replace(/^\/\.expo\/\.virtual-metro-entry\.(bundle|map)$/, '/node_modules/expo-router/entry.$1');
  if (/\.(bundle|map)$/.test(url.pathname)) {
    url.searchParams.set('transform.routerRoot', 'app');
    url.searchParams.set('transform.engine', 'hermes');
    url.searchParams.set('transform.asyncRoutes', 'false');
  }
  // Metro's HMR registration requires an absolute URL when it receives one.
  // Only normal HTTP middleware requests may remain relative.
  return rewrite(/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(requestUrl) ? url.toString() : url.pathname + url.search);
}

async function main() {
  const Metro = require('metro');
  const { loadConfig } = require('metro-config');
  const { createDevMiddleware } = require('@react-native/dev-middleware');
  const projectRoot = path.resolve(__dirname, '..');
  process.chdir(projectRoot);
  process.env.NODE_ENV = 'development';
  const config = await loadConfig({ cwd: projectRoot, config: path.join(projectRoot, 'metro.config.js'), maxWorkers: 4 });
  config.resolver.useWatchman = false;
  const rewrite = config.server.rewriteRequestUrl;
  config.server.rewriteRequestUrl = (url) => rewriteNativeRequestUrl(url, rewrite);
  const enhance = config.server.enhanceMiddleware;
  config.server.enhanceMiddleware = (middleware, server) => {
    const nextMiddleware = enhance(middleware, server);
    return (request, response, next) => {
      if (request.url?.split('?')[0] === '/status') {
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end('packager-status:running');
        return;
      }
      nextMiddleware(request, response, next);
    };
  };
  const dev = createDevMiddleware({
    serverBaseUrl: 'http://127.0.0.1:8081',
    logger: console,
    unstable_experiments: { enableStandaloneFuseboxShell: false },
  });
  await Metro.runServer(config, {
    host: '127.0.0.1',
    port: 8081,
    unstable_extraMiddleware: [dev.middleware],
    websocketEndpoints: dev.websocketEndpoints,
  });
  console.log('HealthyOMe native Metro ready at http://127.0.0.1:8081 (no Expo CLI).');
}

module.exports = { rewriteNativeRequestUrl, main };
if (require.main === module) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
