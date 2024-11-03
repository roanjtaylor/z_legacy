import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";

// For useState for button handling
import React from "react";

// Green Arrow for "Sign In" button
import GreenArrow from "../../assets/global/GreenArrow.png";

// Google Icon for google sign-in option
import GoogleSignIn from "../../assets/registerlogin/GoogleSignInNeutral.png";

// Firebase authentication for Login
import { auth } from "../../firebaseConfig"; // Reference to the Firebase KONI project
import { signInWithEmailAndPassword } from "firebase/auth"; // Functions for Authentication (downloaded in the Firebase JS SDK)

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Login details for Admin account (kept here in the code, separate to the database)
  const adminUsername = "Admin";
  const adminPassword = "REMOVED_PASSWORD";

  const forgotPasswordClicked = () => {
    // Email a link to reset password!!!
  };

  const googleClicked = () => {
    // Google sign up call to Firebase!!!
  };

  const loginUser = () => {
    navigation.goBack(); // Pops Login screen off stack
    navigation.navigate("User", {
      userEmail: email.toLocaleLowerCase(), // Ensures same processing for database- roanj.. ==  Roanj..- so no duplicates.
      userPassword: password,
    }); // Pushes User screen onto stack, passing account parameters to it
  };

  const loginClicked = () => {
    // Admin login
    if (email === adminUsername && password === adminPassword) {
      navigation.goBack(); // Pops Login screen off stack
      navigation.navigate("Admin"); // Pushes Admin screen onto stack
    } else {
      // User login
      signInWithEmailAndPassword(auth, email, password)
        .then((response) => loginUser())
        .catch((error) =>
          // Error produced if login attempt fails
          Alert.alert(
            "Login Error",
            "Those details do not match our records. Please try again.",
            [{ text: "OK" }]
          )
        );
    }
  };

  const registerClicked = () => {
    navigation.goBack(); // Pops Login screen off stack
    navigation.navigate("Register"); // Pushes Register screen onto stack
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Screen Title */}
      <Text style={styles.headingText}>Welcome Back!</Text>

      {/* Input fields for Registration */}
      <TextInput
        style={styles.inputFields}
        onChangeText={setEmail}
        value={email}
        placeholder="> Email address"
        placeholderTextColor="#7D7678"
      />
      <TextInput
        style={styles.inputFields}
        onChangeText={setPassword}
        value={password}
        placeholder="> Password"
        placeholderTextColor="#7D7678"
        secureTextEntry={true} // Password field, hiding the characters entered
      />

      {/* "Forgot password?" button */}
      {/* <TouchableOpacity
        style={styles.fpOpacity}
        onPress={() => forgotPasswordClicked()}
      >
        <Text style={styles.fpText}>Forgot password?</Text>
      </TouchableOpacity> */}

      {/* Google Sign In Option */}
      {/* <Text style={styles.alternativeGoogleText}>
        Alternatively, sign in with Google:
      </Text>
      <TouchableOpacity
        style={styles.googleOpacity}
        onPress={() => googleClicked()}
      >
        <Image source={GoogleSignIn} style={styles.googleSIImage} />
      </TouchableOpacity> */}

      {/* "Sign In" button */}
      <TouchableOpacity style={styles.siOpacity} onPress={() => loginClicked()}>
        <Text style={styles.siText}>
          Sign In <Image source={GreenArrow} style={styles.gArrow} />
        </Text>
      </TouchableOpacity>

      {/* Button to access Register page */}
      <TouchableOpacity
        style={styles.registerOpacity}
        onPress={() => registerClicked()}
      >
        <Text style={styles.registerText}>Don't have an account?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%", // Copied from Welcome screen for responsive layout
    height: "100%",
    padding: "7%", // Space that is not the screen- blank space for ease of layouts
    alignItems: "center", // Horizontally centers all content
    backgroundColor: "rgb(35, 31, 32)", // Charcoal grey
  },

  // Headline texts
  headingText: {
    fontSize: 32,
    fontWeight: "700",
    color: "rgb(0,225,130)", // turqoise green
    textAlign: "center",
    marginTop: "5%",
  },

  // Input fields
  inputFields: {
    width: "100%",
    height: "10%",
    padding: "8.75%",
    marginTop: "10%",

    fontSize: 18, // Font size of text within input field
    color: "white", // Colour of INPUTTED text

    borderRadius: 10,
    backgroundColor: "#413C3D", // Lighter gray
  },

  // "Forgot Password" button
  fpOpacity: {
    width: "100%", // full width of screen
    marginTop: "3%",
  },

  fpText: {
    fontSize: 18,
    textAlign: "right", // RHS of the opacity box
    color: "rgb(0,225,130)", // turqoise green
  },

  // Google alternative option
  alternativeGoogleText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: "10%",
    color: "cyan",
    textDecorationLine: "underline",
  },

  googleOpacity: {
    width: "100%", //  Defines size of opacity
    height: "10%",
    marginTop: "5%",
  },

  googleSIImage: {
    width: "100%", // Fills the opacity (as parent component)
    height: "100%",
  },

  // "Sign In" button
  siOpacity: {
    marginTop: "7%",
    width: "100%",
    padding: "5%",
    backgroundColor: "rgb(0,225,130)", // turqoise green
    borderRadius: "100%",
  },

  siText: {
    fontSize: 24,
    textAlign: "center",
    fontWeight: "700",
    color: "white",
  },

  gArrow: {
    width: 24,
    height: 24,
    backgroundColor: "white",
    borderRadius: "100%",
  },

  // "Don't have an account?" button
  registerOpacity: {
    marginTop: "7%",
  },

  registerText: {
    fontSize: 18,
    textAlign: "center",
    color: "rgb(0,225,130)", // turqoise green
  },
});
