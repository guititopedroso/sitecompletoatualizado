import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCmGZuzO56f-fFVyqYZLL8qfMYjFEbRVHU",
  authDomain: "royalcoast-ef8f7.firebaseapp.com",
  projectId: "royalcoast-ef8f7",
  storageBucket: "royalcoast-ef8f7.firebasestorage.app",
  messagingSenderId: "340938308657",
  appId: "1:340938308657:web:815717e2ac692ea2322910",
  measurementId: "G-PQS7G7Z36T"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;