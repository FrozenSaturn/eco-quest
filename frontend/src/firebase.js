// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfphJ-3ANVn0ACzln4ZSOs6L1Z7vfxmE0",
  authDomain: "releaf-test-a31e7.firebaseapp.com",
  projectId: "releaf-test-a31e7",
  storageBucket: "releaf-test-a31e7.firebasestorage.app",
  messagingSenderId: "14461351427",
  appId: "1:14461351427:web:b8284e6c931b2a6af88036",
  measurementId: "G-6M5F0F7NR9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);