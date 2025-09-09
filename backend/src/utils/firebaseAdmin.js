// backend/src/utils/firebaseAdmin.js
const admin = require('firebase-admin');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // expect env var to be base64-encoded JSON of serviceAccountKey.json
  serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
} else {
  // fallback for local dev (DO NOT commit serviceAccount json)
  serviceAccount = require('../../firebase-service-account.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
