// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBimQ8pY47mIVXh9HnKbWHh7YbxTgWSohY",
  authDomain: "book-writer-e523a.firebaseapp.com",
  projectId: "book-writer-e523a",
  storageBucket: "book-writer-e523a.firebasestorage.app",
  messagingSenderId: "309002653823",
  appId: "1:309002653823:web:6ed55e6c4a5033771caf4a",
  measurementId: "G-KDESE4FEHL"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;