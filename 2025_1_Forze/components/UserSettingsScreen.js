import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import { auth, firestore } from "../firebaseConfig";
import {
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  where,
  writeBatch,
  query,
  setDoc,
  deleteDoc,
  arrayRemove,
} from "firebase/firestore";
import CustomButton from "./CustomButton";
import { Ionicons } from "@expo/vector-icons"; // Icons for styling

export default function UserView({ navigation, user, reloadUser }) {
  const [forename, setForename] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [userPassword, setUserPassword] = useState(""); // Store password for reauthentication

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, "users", user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setForename(data.forename || "");
          setSurname(data.surname || "");
          setEmail(user.id || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user.id]);

  // Update user details in Firestore
  const updateUserDetails = async () => {
    try {
      const userDocRef = doc(firestore, "users", user.id);
      await updateDoc(userDocRef, { forename, surname });
      Alert.alert("Success", "Your details have been updated.");
      reloadUser();
    } catch (error) {
      console.error("Error updating user details:", error);
      Alert.alert("Error", "Failed to update details.");
    }
  };

  // Submit feedback
  const submitFeedback = async () => {
    try {
      // Generate a custom feedback ID using user ID and the current date (formatted as DD-MM-YYYY)
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0"); // Add leading zero if day < 10
      const month = String(today.getMonth() + 1).padStart(2, "0"); // Add leading zero if month < 10
      const year = today.getFullYear();

      const hours = String(today.getHours()).padStart(2, "0"); // Add leading zero if hours < 10
      const minutes = String(today.getMinutes()).padStart(2, "0"); // Add leading zero if minutes < 10
      const seconds = String(today.getSeconds()).padStart(2, "0"); // Add leading zero if minutes < 10

      const time = `${hours}:${minutes}:${seconds}`;

      const feedbackId =
        day + "-" + month + "-" + year + "-" + time + "-" + user.id; // Format: userId-DD-MM-YYYY

      // Create a reference to the "feedback" collection and specify the custom ID
      const feedbackRef = doc(firestore, "feedback", feedbackId);

      // Set the data in the feedback document
      await setDoc(feedbackRef, {
        userId: user.id,
        feedback,
        submittedAt: new Date(),
        read: false,
      });

      Alert.alert("Thank you", "Your feedback has been submitted.");
      setFeedback("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Failed to submit feedback.");
    }
  };

  // Reauthenticate and delete the account
  const deleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Step 1: Reauthenticate the user
              const credential = EmailAuthProvider.credential(
                user.id,
                userPassword
              );
              await reauthenticateWithCredential(auth.currentUser, credential);

              // Step 2: Remove the user from matches
              const matchesRef = collection(firestore, "matches");
              const querySnapshot = await getDocs(
                query(matchesRef, where("users", "array-contains", user.id))
              );
              const batch = writeBatch(firestore);

              querySnapshot.forEach((doc) => {
                batch.update(doc.ref, {
                  users: arrayRemove(user.id), // Remove user's email from the users array
                });
              });

              await batch.commit();

              // Step 3: Delete the user's document from Firestore
              await deleteDoc(doc(firestore, "users", user.id));

              // Step 4: Delete the user from Firebase Authentication
              await deleteUser(auth.currentUser); // Ensure `auth.currentUser` has the correct email

              // Redirect to Welcome screen
              navigation.reset({
                index: 0,
                routes: [{ name: "Welcome" }],
              });
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  const confirmSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", onPress: signOutUser },
      ],
      { cancelable: true }
    );
  };

  async function signOutUser() {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: "Welcome" }],
      });
    } catch (error) {
      console.error("Error signing out:", error.message);
      Alert.alert("Error", "Failed to sign out.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.innerContainer}>
      <Text style={styles.title}>Settings</Text>

      {/* User Details Section */}
      <TextInput
        style={styles.input}
        placeholder="Forename"
        value={forename}
        onChangeText={setForename}
      />
      <TextInput
        style={styles.input}
        placeholder="Surname"
        value={surname}
        onChangeText={setSurname}
      />
      <TextInput
        style={[styles.input, styles.disabledInput]}
        placeholder="Email"
        value={email}
        editable={false}
      />
      <CustomButton title="Update Details" onPress={updateUserDetails} />

      {/* Feedback Section */}
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Your feedback and requests shape this app and the community. What do you want?"
        value={feedback}
        onChangeText={setFeedback}
        multiline
        numberOfLines={4}
      />
      <CustomButton title="Submit Feedback" onPress={submitFeedback} />

      {/* Password Input for Deletion */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter your password to confirm"
          value={userPassword}
          onChangeText={setUserPassword}
          secureTextEntry={!passwordVisible} // Toggle visibility
        />
        <TouchableOpacity
          onPress={() => setPasswordVisible(!passwordVisible)} // Toggle state
          style={styles.iconContainer}
        >
          <Ionicons
            name={passwordVisible ? "eye" : "eye-off"}
            size={24}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      {/* Delete Account Button */}
      <TouchableOpacity onPress={deleteAccount} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>

      {/* Sign Out Button */}
      <View style={styles.signOutPadding}>
        <CustomButton title="Sign Out" onPress={confirmSignOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    margin: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  disabledInput: {
    backgroundColor: "#f9f9f9",
  },
  // Password field
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 50,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
  },
  iconContainer: {
    padding: 5,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    marginTop: 50,
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    width: "50%",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  signOutPadding: {
    margin: 50,
    width: "50%",
  },
});
