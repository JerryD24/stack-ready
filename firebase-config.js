/**
 * StackReady — Firebase config for cross-device progress sync.
 *
 * HOW TO FILL THIS (one-time, ~5 min):
 *   1. Go to https://console.firebase.google.com/ → "Add project" (any name, e.g. stackready).
 *      Disable Google Analytics (not needed) → Create.
 *   2. In the project, click the Web icon "</>" → register an app (nickname: stackready-web).
 *      It shows a `firebaseConfig` object — copy those values below.
 *   3. Left menu → Build → Authentication → Get started → Sign-in method →
 *      enable "Google" → Save.
 *   4. Left menu → Build → Firestore Database → Create database →
 *      Start in PRODUCTION mode → pick a region → Enable.
 *   5. Firestore → Rules tab → paste these rules → Publish:
 *
 *        rules_version = '2';
 *        service cloud.firestore {
 *          match /databases/{database}/documents {
 *            match /users/{uid} {
 *              allow read, write: if request.auth != null && request.auth.uid == uid;
 *            }
 *          }
 *        }
 *
 *   6. Authentication → Settings → Authorized domains → "Add domain" →
 *      add:  jerryd24.github.io   (and "localhost" for local testing).
 *   7. Paste your config values below and push. Done — Sign in with Google on both devices.
 *
 * NOTE: These web config values are NOT secret (they identify the project, not authorize access).
 *       Security is enforced by the Firestore rules above. Safe to commit.
 *       Until you fill apiKey, the site simply runs in cookie-only mode (no sync button).
 */
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
