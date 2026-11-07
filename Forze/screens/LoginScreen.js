import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import CustomButton from "../components/CustomButton";
import { Ionicons } from "@expo/vector-icons"; // Icons for styling

import { auth } from "../firebaseConfig"; // Correct import of auth from firebaseConfig
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth"; // Import Firebase auth method
import { sendPasswordResetEmail } from "firebase/auth"; // Password reset function

// Mock functions for social login
// const handleAppleSignIn = () => Alert.alert("Apple Sign In Clicked");
// const handleGoogleSignIn = () => Alert.alert("Google Sign In Clicked");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle user login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both your email and password.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Reload user data to ensure the latest emailVerified status
      await user.reload();

      // Check if the user's email is verified
      if (!user.emailVerified) {
        setLoading(false); // Stop loading spinner
        Alert.alert(
          "Email Not Verified",
          "A new verification link has been sent to the entered email. You must verify your email address before logging in."
        );

        // Send a new verification email
        await sendEmailVerification(user);
        // auth.signOut(); // Sign out unverified users// Maybe needed to fix bug of login without verification?
        return; // Stop execution to prevent further navigation
      }

      // Email is verified, navigate to the main screen
      setLoading(false);
      navigation.replace("Main"); // Navigate to the main screen
    } catch (error) {
      setLoading(false);

      switch (error.code) {
        case "auth/user-not-found":
          Alert.alert("Error", "No user found with this email.");
          break;
        case "auth/wrong-password":
          Alert.alert("Error", "Incorrect password.");
          break;
        default:
          Alert.alert("Error", error.message);
          break;
      }
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Password Reset",
        "A password reset link has been sent to the email you entered."
      );
    } catch (error) {
      console.error("Error sending password reset email:", error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Close Button to Dismiss the Modal */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.closeButton}
      >
        <Text style={styles.closeText}>X</Text>
      </TouchableOpacity>

      {/* Registration Form */}
      <Text style={styles.formTitle}>Sign In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
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

      {/* Forgot Password Button */}
      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={handleForgotPassword}
      >
        <Text style={styles.forgotPassword}>Forgot your password?</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <CustomButton title="Login" onPress={handleLogin} />

      {/* Heading */}
      {/* <Text style={styles.orText}>Alternatively, use one of these:</Text>
      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconButton} onPress={handleAppleSignIn}>
          <Ionicons name="logo-apple" size={50} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleGoogleSignIn}
        >
          <Ionicons name="logo-google" size={50} color="#DB4437" />
        </TouchableOpacity>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#21252B",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    width: "100%",
    backgroundColor: "white",
  },

  // Password field
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "white",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
  },
  iconContainer: {
    padding: 5,
  },

  // Forgot password button
  forgotPasswordButton: {
    alignSelf: "flex-end",
  },

  forgotPassword: {
    color: "#1E90FF",
    textDecorationLine: "underline",
    marginBottom: 15,
  },

  // Close button
  closeButton: {
    position: "absolute",
    top: 30,
    right: 30,
    backgroundColor: "#ccc",
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: { fontSize: 18, color: "black" },

  // Social sign-up options
  // orText: {
  //   fontSize: 16,
  //   color: "#555",
  //   margin: 15,
  //   textDecorationLine: "underline",
  // },
  // iconRow: {
  //   flexDirection: "row", // Arrange icons in a horizontal row
  //   justifyContent: "center", // Center icons horizontally
  //   alignItems: "center", // Align icons vertically
  //   marginTop: 10,
  //   marginBottom: 100, // Ensure social icons don't overlap the button
  // },
  // iconButton: {
  //   marginHorizontal: 15, // Add space between the icons
  //   padding: 5,
  //   borderRadius: 5,
  //   backgroundColor: "white",
  // },
});
