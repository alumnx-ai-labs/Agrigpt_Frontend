// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC-o8VVHfBIdYOgJ3m4FEltuRpoH1bVbMA",
  authDomain: "agrigpt-rag.firebaseapp.com",
  projectId: "agrigpt-rag",
  storageBucket: "agrigpt-rag.firebasestorage.app",
  messagingSenderId: "396900006284",
  appId: "1:396900006284:web:189eac552229b01b817ea9",
  measurementId: "G-PE49CE3WXH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);