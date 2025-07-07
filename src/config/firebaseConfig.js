const admin = require('firebase-admin');

let app = null;

const initializeFirebase = () => {
  try {
    // Check if Firebase app is already initialized
    if (app) {
      return app;
    }

    // Get Firebase credentials from environment variables
    const {
      FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_CLIENT_ID,
      FIREBASE_PRIVATE_KEY_ID
    } = process.env;

    // Check if all required environment variables are present
    if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
      console.warn('Firebase configuration is incomplete. Push notifications will not work.');
      return null;
    }

    // Format the private key (handle escaped newlines)
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const serviceAccount = {
      type: 'service_account',
      project_id: FIREBASE_PROJECT_ID,
      private_key_id: FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: FIREBASE_CLIENT_EMAIL,
      client_id: FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${FIREBASE_CLIENT_EMAIL}`
    };

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: FIREBASE_PROJECT_ID
    });

    console.log('Firebase Admin SDK initialized successfully');
    return app;

  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    return null;
  }
};

const getFirebaseApp = () => {
  if (!app) {
    return initializeFirebase();
  }
  return app;
};

const getMessaging = () => {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }
  return admin.messaging();
};

module.exports = {
  initializeFirebase,
  getFirebaseApp,
  getMessaging
};
