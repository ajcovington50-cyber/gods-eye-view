import { timingSafeEqual } from 'node:crypto';

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Gate every request behind HTTP Basic Auth when GEV_AUTH_USER and
 * GEV_AUTH_PASS are both set. Absent either one, this is a no-op — local
 * development stays password-free by default. Meant for deployments reachable
 * from the open internet, since this app has no other login layer.
 */
export function basicAuthPlugin() {
  const user = process.env.GEV_AUTH_USER;
  const pass = process.env.GEV_AUTH_PASS;
  if (!user || !pass) return { name: 'gev-basic-auth' };

  const expected = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;

  function middleware(req, res, next) {
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
