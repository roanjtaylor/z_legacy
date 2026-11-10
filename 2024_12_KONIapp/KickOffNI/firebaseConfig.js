// Import initializeApp function from the downloaded Firebase library
import { initializeApp } from "firebase/app";

// Import getFirestore function from the Firestore library
import { getFirestore } from "firebase/firestore";

// Libraries imported for state persistence, keeping the user logged in between sessions
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnWNYd3pHivqfPMj5Aje1ZQAws0Hwvu-A",
  authDomain: "kickoffni-uniqueid24.firebaseapp.com",
  databaseURL: "https://project-id.firebaseio.com",
  projectId: "kickoffni-uniqueid24",
  storageBucket: "kickoffni-uniqueid24.appspot.com",
  messagingSenderId: "465691940116",
  appId: "1:465691940116:web:fee71e90b1580063729e01",
  measurementId: "G-measurement-id",
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
