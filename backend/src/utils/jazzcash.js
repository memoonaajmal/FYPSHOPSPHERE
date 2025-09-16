// backend/src/utils/jazzcash.js
const crypto = require('crypto');

function toIso88591(str) {
  // convert utf8 -> iso-8859-1 (latin1) string
  return Buffer.from(str, 'utf8').toString('latin1');
}

function generateSecureHash(ppFields, integritySalt) {
  // include only keys that start with 'pp' (case-insensitive) and are non-empty
  const keys = Object.keys(ppFields)
    .filter(k => /^pp/i.test(k) && ppFields[k] !== undefined && ppFields[k] !== null && String(ppFields[k]) !== '')
    .sort(); // ASCII alphabetical

  const valuesStr = keys.map(k => String(ppFields[k])).join('&');
  // prepend shared secret (integrity salt)
  const toHash = `${integritySalt}&${valuesStr}`;

  // convert to ISO-8859-1 (docs require this step) then HMAC-SHA256 using the integritySalt as key
  const toHashLatin1 = toIso88591(toHash);
  const hmac = crypto.createHmac('sha256', Buffer.from(integritySalt, 'utf8'));
  hmac.update(Buffer.from(toHashLatin1, 'latin1'));
  return hmac.digest('hex').toUpperCase();
}

function formatTxnDate(d = new Date()) {
  // yyyyMMddHHmmss
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}${mm}${dd}${hh}${mi}${ss}`;
}

module.exports = { generateSecureHash, formatTxnDate };
