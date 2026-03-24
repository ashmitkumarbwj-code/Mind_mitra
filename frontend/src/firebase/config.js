import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBvqI8TYCu6CvPjocuz8BVLs3hCRxkhER0",
  authDomain: "mind-mitra-c23c1.firebaseapp.com",
  projectId: "mind-mitra-c23c1",
  storageBucket: "mind-mitra-c23c1.firebasestorage.app",
  messagingSenderId: "634917945765",
  appId: "1:634917945765:web:9ac91d1441c3c3fe97284c",
  measurementId: "G-H1GLXW2PEJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
