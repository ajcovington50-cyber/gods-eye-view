import { timingSafeEqual } from 'node:crypto';

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// PWA install assets: no user data, and platform install checks don't
// reliably attach Basic Auth credentials when fetching them out-of-band —
// notably iOS Safari's "Add to Home Screen" touch-icon fetch, which silently
// falls back to a generic icon on a 401 instead of prompting for
// credentials. Exempting them costs nothing (there's no data here) and fixes
// that fallback.
const PUBLIC_PATHS = new Set(['/manifest.webmanifest', '/sw.js']);

export function isPublicAsset(pathname) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith('/icons/');
}

/**
 * Gate every other request behind HTTP Basic Auth when GEV_AUTH_USER and
 * GEV_AUTH_PASS are both set. Absent either one, this returns null and adds
 * no plugin at all — local development stays password-free by default and
 * the plugin list keeps its usual shape. Meant for deployments reachable
 * from the open internet, since this app has no other login layer.
 */
export function basicAuthPlugin() {
  const user = process.env.GEV_AUTH_USER;
  const pass = process.env.GEV_AUTH_PASS;
  if (!user || !pass) return null;

  const expected = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;

  function middleware(req, res, next) {
    if (isPublicAsset(req.url.split('?')[0])) {
      next();
      return;
    }
    const header = req.headers.authorization || '';
    if (safeEqual(header, expected)) {
      next();
      return;
    }
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="God\'s Eye View"');
    res.end('Authentication required.');
  }

  return {
    name: 'gev-basic-auth',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
