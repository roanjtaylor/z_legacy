import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  RefreshControl,
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
  query,
  where,
  writeBatch,
  deleteDoc,
  arrayRemove,
} from "firebase/firestore";
import CustomButton from "./CustomButton";

export default function AdminSettings({ navigation, user, reloadUser }) {
  const [forename, setForename] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [userPassword, setUserPassword] = useState(""); // Store password for reauthentication
  const [feedbackList, setFeedbackList] = useState([]); // Store feedback messages
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh

  // Fetch user data from Firestore
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

  const fetchFeedbackMessages = async () => {
    try {
      const feedbackRef = collection(firestore, "feedback");
      const querySnapshot = await getDocs(
        query(feedbackRef, where("read", "==", false))
      );
      const messages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFeedbackList(messages.sort((a, b) => b.submittedAt - a.submittedAt)); // Sort by most recent
    } catch (error) {
      console.error("Error fetching feedback messages:", error);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchUserData();
    fetchFeedbackMessages();
  }, [user.id]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserData(), fetchFeedbackMessages()]);
    setRefreshing(false);
  };

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

  // Mark feedback message as read
  const markAsRead = async (id) => {
    try {
      const feedbackRef = doc(firestore, "feedback", id);
      await updateDoc(feedbackRef, { read: true });
      setFeedbackList(feedbackList.filter((message) => message.id !== id));
      Alert.alert("Success", "Message marked as read.");
    } catch (error) {
      console.error("Error marking message as read:", error);
      Alert.alert("Error", "Failed to mark message as read.");
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
              const credential = EmailAuthProvider.credential(
                user.id,
                userPassword
              );
              await reauthenticateWithCredential(auth.currentUser, credential);

              // Remove email from "createdBy" in matches
              const matchesRef = collection(firestore, "matches");
              const querySnapshot = await getDocs(
                query(matchesRef, where("createdBy", "==", user.id))
              );
              const batch = writeBatch(firestore);

              querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { createdBy: arrayRemove(user.id) });
              });

              await batch.commit();

              // Delete user's document and Firebase account
              await deleteDoc(doc(firestore, "users", user.id));
              await deleteUser(auth.currentUser);

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
    <ScrollView
      contentContainerStyle={styles.innerContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Admin Settings</Text>

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

      {/* Feedback Messages */}
      <View style={styles.feedbackContainer}>
        <Text style={styles.sectionTitle}>Unread Feedback:</Text>
        {feedbackList.length === 0 ? (
          <Text style={styles.noFeedbackText}>No unread messages.</Text>
        ) : (
          feedbackList.map((message) => (
            <View key={message.id} style={styles.feedbackItem}>
              <Text style={styles.feedbackText}>{message.feedback}</Text>
              <TouchableOpacity
                style={styles.markReadButton}
                onPress={() => markAsRead(message.id)}
              >
                <Text style={styles.markReadButtonText}>Mark as Read</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Delete Account */}
      <TextInput
        style={styles.input}
        placeholder="Enter your password to delete account"
        value={userPassword}
        onChangeText={setUserPassword}
        secureTextEntry
      />
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
  feedbackContainer: {
    width: "100%",
    marginTop: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noFeedbackText: {
    fontStyle: "italic",
    textAlign: "center",
  },
  feedbackItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  feedbackText: {
    flex: 1,
  },
  markReadButton: {
    backgroundColor: "#4CAF50",
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  markReadButtonText: {
    color: "#fff",
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
