import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCJn2zMfWYz_gFN5goDUrkUjVAIqPGCW-Y",
  authDomain: "mtxr-d8b90.firebaseapp.com",
  databaseURL: "https://mtxr-d8b90-default-rtdb.firebaseio.com",
  projectId: "mtxr-d8b90",
  storageBucket: "mtxr-d8b90.firebasestorage.app",
  messagingSenderId: "688078973753",
  appId: "1:688078973753:web:c7279cdd8ba04c8e0b56e8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
