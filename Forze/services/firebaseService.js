import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Fetch user data from Firebase using the email
export async function fetchUserData() {
  const auth = getAuth();
  const db = getFirestore();

  const user = auth.currentUser;
  if (user && user.email) {
    const userDocRef = doc(db, "users", user.email);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { id: user.email, ...userDoc.data() }; // Return user data with email as ID
    } else {
      console.error("No such user data in Firestore!");
    }
  } else {
    console.error("No authenticated user found!");
  }
  return null;
}
