import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCIiG2z0N-_Mp_K82kO45ljDkWKWLfTS6M",
  authDomain: "mind-mitra-62dda.firebaseapp.com",
  projectId: "mind-mitra-62dda",
  storageBucket: "mind-mitra-62dda.firebasestorage.app",
  messagingSenderId: "783543989393",
  appId: "1:783543989393:web:76a68ab94f8500398a3b30",
  measurementId: "G-WR6R97C338"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail };
