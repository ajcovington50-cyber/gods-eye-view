import test from 'node:test';
import assert from 'node:assert/strict';
import { basicAuthPlugin, isPublicAsset } from '../../build/basicAuth.js';

function withAuthEnv(user, pass, fn) {
  const beforeUser = process.env.GEV_AUTH_USER;
  const beforePass = process.env.GEV_AUTH_PASS;
  if (user === undefined) delete process.env.GEV_AUTH_USER;
  else process.env.GEV_AUTH_USER = user;
  if (pass === undefined) delete process.env.GEV_AUTH_PASS;
  else process.env.GEV_AUTH_PASS = pass;
  try {
    return fn();
  } finally {
    if (beforeUser === undefined) delete process.env.GEV_AUTH_USER;
    else process.env.GEV_AUTH_USER = beforeUser;
    if (beforePass === undefined) delete process.env.GEV_AUTH_PASS;
    else process.env.GEV_AUTH_PASS = beforePass;
  }
}

function capturedMiddleware(plugin) {
  let middleware;
  plugin.configureServer({ middlewares: { use: (fn) => (middleware = fn) } });
  return middleware;
}

function fakeResponse() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body;
    },
  };
}

test('isPublicAsset admits only PWA install assets', () => {
  assert.ok(isPublicAsset('/manifest.webmanifest'));
  assert.ok(isPublicAsset('/sw.js'));
  assert.ok(isPublicAsset('/icons/apple-touch-icon.png'));
  assert.ok(isPublicAsset('/icons/icon-512-maskable.png'));
  assert.ok(!isPublicAsset('/'));
  assert.ok(!isPublicAsset('/index.html'));
  assert.ok(!isPublicAsset('/server/providers/live'));
  assert.ok(!isPublicAsset('/iconsx/sneaky.png'), 'must not match on a bare prefix');
});

test('missing credentials produce no plugin at all', () => {
  withAuthEnv(undefined, undefined, () => {
    assert.equal(basicAuthPlugin(), null);
  });
  withAuthEnv('user', undefined, () => {
    assert.equal(basicAuthPlugin(), null);
  });
  withAuthEnv(undefined, 'pass', () => {
    assert.equal(basicAuthPlugin(), null);
  });
});

test('PWA install assets bypass the gate even when credentials are configured', () => {
  withAuthEnv('user', 'pass', () => {
    const middleware = capturedMiddleware(basicAuthPlugin());
    for (const url of ['/manifest.webmanifest', '/sw.js', '/icons/icon-192.png?v=2']) {
      let nextCalled = false;
      const res = fakeResponse();
      middleware({ url, headers: {} }, res, () => (nextCalled = true));
      assert.ok(nextCalled, `${url} should pass through without credentials`);
      assert.equal(res.statusCode, 200);
    }
  });
});

test('every other request is rejected without the matching credential', () => {
  withAuthEnv('user', 'pass', () => {
    const middleware = capturedMiddleware(basicAuthPlugin());
    let nextCalled = false;
    const res = fakeResponse();
    middleware({ url: '/', headers: {} }, res, () => (nextCalled = true));
    assert.ok(!nextCalled);
    assert.equal(res.statusCode, 401);
    assert.equal(res.headers['WWW-Authenticate'], 'Basic realm="God\'s Eye View"');
  });
});

test('the matching credential passes the gate', () => {
  withAuthEnv('user', 'pass', () => {
    const middleware = capturedMiddleware(basicAuthPlugin());
    let nextCalled = false;
    const res = fakeResponse();
    const authorization = `Basic ${Buffer.from('user:pass').toString('base64')}`;
    middleware({ url: '/', headers: { authorization } }, res, () => (nextCalled = true));
    assert.ok(nextCalled);
    assert.equal(res.statusCode, 200);
  });
});
