// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import {getAuth} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCqtbe-r3ReNOqwDY2r7DJ_9sIn_j4TnG4",
    authDomain: "smart-attendance-trackin-9957f.firebaseapp.com",
    projectId: "smart-attendance-trackin-9957f",
    storageBucket: "smart-attendance-trackin-9957f.firebasestorage.app",
    messagingSenderId: "849201739961",
    appId: "1:849201739961:web:9c7a219d2d3bde1d100368",
    measurementId: "G-Q2NZ3VQZNQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);