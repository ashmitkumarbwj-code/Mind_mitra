import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
