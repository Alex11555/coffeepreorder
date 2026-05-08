// Authentication middleware: pulls a Bearer JWT off the request and
// attaches { id, role, email } to req.user.
//
// `requireAuth` reads the token from the Authorization header.
// `requireAuthOrQuery` ALSO accepts `?token=...` — needed for EventSource
// connections (browser EventSource can't set custom headers).

const { verifyToken } = require('../utils/jwt');

function pickToken(req, allowQuery) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) return token;
  if (allowQuery && typeof req.query.token === 'string' && req.query.token) {
    return req.query.token;
  }
  return null;
}

function makeAuth(allowQuery) {
  return (req, _res, next) => {
    const token = pickToken(req, allowQuery);
    if (!token) return next({ status: 401, message: 'Missing bearer token' });
    try {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, role: payload.role, email: payload.email };
      next();
    } catch {
      next({ status: 401, message: 'Invalid or expired token' });
    }
  };
}

const requireAuth = makeAuth(false);
const requireAuthOrQuery = makeAuth(true);

function requireStaff(req, _res, next) {
  if (!req.user || req.user.role !== 'STAFF') {
    return next({ status: 403, message: 'Staff only' });
  }
  next();
}

module.exports = { requireAuth, requireAuthOrQuery, requireStaff };
