
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCLwVqbIMVPHpO2bCFPNkNfi0Mpx2fmyS4",
    authDomain: "pareil-pareil.firebaseapp.com",
    projectId: "pareil-pareil",
    storageBucket: "pareil-pareil.firebasestorage.app",
    messagingSenderId: "369597939684",
    appId: "1:369597939684:web:7f6151a88eead0555c11f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

/**
 * إعدادات Firestore المتقدمة لضمان استقرار الاتصال في البيئات المختلفة
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

export const auth = getAuth(app);
