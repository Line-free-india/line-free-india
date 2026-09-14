import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const getValidConfig = (val: string | undefined, fallback: string) => {
  return (!val || val.trim() === '' || val.startsWith('mock-')) ? fallback : val;
};

const firebaseConfig = {
  apiKey: getValidConfig(import.meta.env.VITE_FIREBASE_API_KEY, "AIzaSyBvIUSBHoQnAvfLrTsLUhSQ-DukjN1OsaQ"),
  authDomain: getValidConfig(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "line-free-india.firebaseapp.com"),
  projectId: getValidConfig(import.meta.env.VITE_FIREBASE_PROJECT_ID, "line-free-india"),
  storageBucket: getValidConfig(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, "line-free-india.firebasestorage.app"),
  messagingSenderId: getValidConfig(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "848717293503"),
  appId: getValidConfig(import.meta.env.VITE_FIREBASE_APP_ID, "1:848717293503:web:3a5e525a689cd64b83230a"),
  measurementId: getValidConfig(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, "G-GZ0B8S4HKZ")
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export let messaging: any = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  } else {
    console.warn("Push messaging is not supported in this browser.");
  }
});
export const storage = getStorage(app);

// ✅ Set persistence immediately — user stays logged in after closing browser
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log('✅ Auth persistence set to LOCAL'))
  .catch((e) => console.warn('Auth persistence error:', e));

export default app;
