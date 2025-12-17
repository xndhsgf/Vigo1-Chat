
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAy2d3Ig7edmX8iAhMFeMD40a-FAK8pbx0",
    authDomain: "vigo1-chat.firebaseapp.com",
    projectId: "vigo1-chat",
    storageBucket: "vigo1-chat.firebasestorage.app",
    messagingSenderId: "443895410846",
    appId: "1:443895410846:web:31be459543e1160b0c4b8f"
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
