// Import initializeApp function from the downloaded Firebase library
import { initializeApp } from "firebase/app";

// Import getFirestore function from the Firestore library
import { getFirestore } from "firebase/firestore";

// Libraries imported for state persistence, keeping the user logged in between sessions
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

// Use Environment variables to keep sensistive data hidden.
import Constants from "expo-constants";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "",
  databaseURL: Constants.expoConfig?.extra?.firebaseDatabaseURL || "",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || "",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "",
  messagingSenderId:
    Constants.expoConfig?.extra?.firebaseMessagingSenderId || "",
  appId: Constants.expoConfig?.extra?.firebaseAppId || "",
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId || "",
};

// Initialize a referenced connection to the KONI Firebase project for ease of use
const app = initializeApp(firebaseConfig);

// Initialize auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { auth, db };
