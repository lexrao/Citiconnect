// ===================================
// Firebase Configuration
// Barangay Danao Reporting Portal
// ===================================
// INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a project (or open existing one)
// 3. Click "Add App" → Web (</>)
// 4. Copy your config values below
// ===================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ↓↓↓ REPLACE THESE WITH YOUR FIREBASE PROJECT VALUES ↓↓↓
const firebaseConfig = {
  apiKey: "AIzaSyCybqxnU9aR0WugZTwGnr-H-k6Y-oZIWps",
  authDomain: "barangay-danao-d4e3a.firebaseapp.com",
  projectId: "barangay-danao-d4e3a",
  storageBucket: "barangay-danao-d4e3a.firebasestorage.app",
  messagingSenderId: "434432164991",
  appId: "1:434432164991:web:774dae0cda6c1b352eeb4a"
};
// ↑↑↑ REPLACE THESE WITH YOUR FIREBASE PROJECT VALUES ↑↑↑

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Expose to global scope (used by citizen-script.js and lgu-script.js)
window.db = db;
window.FirebaseFirestore = {
    collection,
    addDoc,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    query,
    orderBy
};

console.log("✅ Firebase initialized — Barangay Danao Portal");
