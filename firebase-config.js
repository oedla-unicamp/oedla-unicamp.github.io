import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDccnfAhZ09Tc3ewq-0q7SGSHkpKWMS00",
  authDomain: "wise-ally-456423-s9.firebaseapp.com",
  projectId: "wise-ally-456423-s9",
  storageBucket: "wise-ally-456423-s9.firebasestorage.app",
  messagingSenderId: "219323121477",
  appId: "1:219323121477:web:856a351b6c62a0d87b082c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
