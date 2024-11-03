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

// Green Arrow for "Create Account" button
import GreenArrow from "../../assets/global/GreenArrow.png";

// Google Icon for google sign-up option
import GoogleSignUp from "../../assets/registerlogin/GoogleSignUpNeutral.png";

// Firebase authentication for Registration
import { auth } from "../../firebaseConfig"; // Reference to the Firebase KONI project
import { createUserWithEmailAndPassword } from "firebase/auth"; // Functions for Authentication (downloaded in the Firebase JS SDK)

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = React.useState("");
  const [password1, setPassword1] = React.useState("");
  const [password2, setPassword2] = React.useState("");

  const googleClicked = () => {
    // Google sign up call to Firebase!!!
  };

  const tcClicked = () => {
    // Load Terms and Conditions
    navigation.navigate("TandCs"); // Pushes Login screen onto stack
  };

  const registerClicked = () => {
    // Check passwords match
    if (password1 === password2) {
      // Check if email is valid? Send verification link?

      // Register account.
      createUserWithEmailAndPassword(auth, email, password1)
        .then((response) =>
          Alert.alert(
            "Success!",
            "Account successfully registered, now please login with these details.",
            [{ text: "OK", onPress: () => loginClicked() }]
          )
        )
        .catch((error) =>
          // Error produced if email already exists in database
          Alert.alert(
            "Error!",
            "An account with that email address already exists, please try again.",
            [{ text: "OK" }]
          )
        );
    } else {
      // Alert User that they entered mismatching passwords
      Alert.alert(
        "Error!",
        "The passwords you entered don't match, please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const loginClicked = () => {
    navigation.goBack(); // Pops Register screen off stack
    navigation.navigate("Login"); // Pushes Login screen onto stack
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Screen Title */}
      <Text style={styles.headingText}>Create an account</Text>

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
        onChangeText={setPassword1}
        value={password1}
        placeholder="> Password"
        placeholderTextColor="#7D7678"
        secureTextEntry={true} // Password field, hiding the characters entered
      />
      <TextInput
        style={styles.inputFields}
        onChangeText={setPassword2}
        value={password2}
        placeholder="> Confirm Password"
        placeholderTextColor="#7D7678"
        secureTextEntry={true}
      />

      {/* Google Sign Up Option */}
      {/* <Text style={styles.alternativeGoogleText}>
        Alternatively, sign up with Google:
      </Text>
      <TouchableOpacity
        style={styles.googleOpacity}
        onPress={() => googleClicked()}
      >
        <Image source={GoogleSignUp} style={styles.googleSUImage} />
      </TouchableOpacity> */}

      {/* Terms and Conditions */}
      <Text style={styles.tcTitle}>By Registering, you agree to our T&Cs.</Text>
      <TouchableOpacity style={styles.tcOpacity} onPress={() => tcClicked()}>
        <Text style={styles.tcText}>Click to read T&Cs.</Text>
      </TouchableOpacity>

      {/* "Create Account" button */}
      <TouchableOpacity
        style={styles.caOpacity}
        onPress={() => registerClicked()}
      >
        <Text style={styles.caText}>
          Create Account <Image source={GreenArrow} style={styles.gArrow} />
        </Text>
      </TouchableOpacity>

      {/* Button to access Login page */}
      <TouchableOpacity
        style={styles.loginOpacity}
        onPress={() => loginClicked()}
      >
        <Text style={styles.loginText}>Already have an account?</Text>
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

  // Google alternative option
  alternativeGoogleText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: "7%",
    color: "cyan",
    textDecorationLine: "underline",
  },

  googleOpacity: {
    width: "100%", //  Defines size of opacity
    height: "10%",
    marginTop: "5%",
  },

  googleSUImage: {
    width: "100%", // Fills the opacity (as parent component)
    height: "100%",
  },

  // Terms and Conditions
  tcTitle: {
    color: "white",
    marginTop: "7%",
    textDecorationLine: "underline",
  },

  tcOpacity: {
    width: "60%",
    marginTop: "5%",
    padding: "5%",
    backgroundColor: "cyan",
    borderRadius: 100,
  },

  tcText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    color: "grey",
  },

  // "Create Account" button
  caOpacity: {
    marginTop: "7%",
    width: "100%",
    padding: "5%",
    backgroundColor: "rgb(0,225,130)", // turqoise green
    borderRadius: "100%",
  },

  caText: {
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

  // "Already have an account?" button
  loginOpacity: {
    marginTop: "7%",
  },

  loginText: {
    fontSize: 18,
    textAlign: "center",
    color: "rgb(0,225,130)", // turqoise green
  },
});
