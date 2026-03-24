import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBUQZRRXyHjYA3ex-OEzdugGzcgn4QR1RA",
  authDomain: "mind-mitra-78dbc.firebaseapp.com",
  projectId: "mind-mitra-78dbc",
  storageBucket: "mind-mitra-78dbc.firebasestorage.app",
  messagingSenderId: "473717376171",
  appId: "1:473717376171:web:123cb38f6f8b8b0e8be3ee",
  measurementId: "G-CS2CDR3BPM"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
