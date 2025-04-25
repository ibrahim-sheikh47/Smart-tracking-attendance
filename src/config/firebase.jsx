import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCqtbe-r3ReNOqwDY2r7DJ_9sIn_j4TnG4",
    authDomain: "smart-attendance-trackin-9957f.firebaseapp.com",
    projectId: "smart-attendance-trackin-9957f",
    storageBucket: "smart-attendance-trackin-9957f.firebasestorage.app",
    messagingSenderId: "849201739961",
    appId: "1:849201739961:web:9c7a219d2d3bde1d100368",
    measurementId: "G-Q2NZ3VQZNQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestoreDb = getFirestore(app);


