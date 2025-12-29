import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBq7kVNFSPipHYEMLMZRhOQvXHwgiNJndQ",
    authDomain: "studentsafety-97a6a.firebaseapp.com",
    projectId: "studentsafety-97a6a",
    storageBucket: "studentsafety-97a6a.firebasestorage.app",
    messagingSenderId: "557632116677",
    appId: "1:557632116677:web:2f8eb09e662b9893b99dac",
    measurementId: "G-S6ME9M54SD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
