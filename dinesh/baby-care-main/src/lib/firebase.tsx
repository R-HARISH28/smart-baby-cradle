import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging"; // <-- Add this import

const firebaseConfig = {
  apiKey: "AIzaSyBUqLVDlNGP6uzDBoxPkxUWFLVY7y5ICtM",
  authDomain: "baby--care.firebaseapp.com",
  projectId: "baby--care",
  storageBucket: "baby--care.firebasestorage.app",
  messagingSenderId: "400476054080",
  appId: "1:400476054080:web:ea2912f6dc561430c535a5",
  measurementId: "G-2GHJ8W0L1N"
};

const app = initializeApp(firebaseConfig);

export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app); // <-- Export messaging