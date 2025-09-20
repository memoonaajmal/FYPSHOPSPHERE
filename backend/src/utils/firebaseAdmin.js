// backend/src/utils/firebaseAdmin.js
const admin = require('firebase-admin');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
} else {
  serviceAccount = require('../../firebase-service-account.json');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
