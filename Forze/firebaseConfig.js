// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getStorage } from "firebase/storage";
import Constants from "expo-constants";

// Your web app's Firebase configuration
const firebaseConfig = Constants.expoConfig?.extra?.firebaseConfig;

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Firebase Auth instance, initialised with AsyncStorage for state persistence
const auth = getAuth(app);

// Firebase storage for images
const storage = getStorage(app);

export { auth }; // Export the auth instance
export default app;

// Initialize Firestore
export const firestore = getFirestore(app);

// Export for images
export { storage };
