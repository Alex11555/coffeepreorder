// QR pickup token utilities.
//
// We generate a 32-byte random token, hand the raw value to the phone, and
// only ever store its sha-256 hash on the server. On scan, the locker hardware
// sends us the raw token; we hash it the same way and look up the QrCode row.

const crypto = require('crypto');

function generateRawToken() {
  // URL-safe base64, 43 chars.
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = { generateRawToken, hashToken };
