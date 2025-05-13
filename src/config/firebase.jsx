import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBC9Hg3gxmocaYQom4pSy8rWc9FyaUXItI",
  authDomain: "hoc-smart-attendance.firebaseapp.com",
  projectId: "hoc-smart-attendance",
  storageBucket: "hoc-smart-attendance.firebasestorage.app",
  messagingSenderId: "75763552277",
  appId: "1:75763552277:web:43ab0c3a8df76cde62be1c",
  measurementId: "G-4FWJN1ZPBM",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestoreDb = getFirestore(app);

export const storage = getStorage(app);
export const functions = getFunctions();
