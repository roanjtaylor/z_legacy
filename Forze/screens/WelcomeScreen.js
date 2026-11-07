import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from "react-native";
import CustomButton from "../components/CustomButton";
import { Ionicons } from "@expo/vector-icons"; // Icons for styling

// REGISTER FUNCTIONS
import { auth } from "../firebaseConfig"; // Correct import of auth from firebaseConfig
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth"; // Import Firebase auth methods
import { firestore } from "../firebaseConfig"; // Ensure firestore is exported from firebaseConfig
import { doc, setDoc } from "firebase/firestore"; // Firestore methods

// Mock functions for social login
// const handleAppleSignIn = () => Alert.alert("Apple Sign In Clicked");
// const handleGoogleSignIn = () => Alert.alert("Google Sign In Clicked");

// Open Link function for T&Cs and Privacy Policy
const openLink = (url) => {
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Unable to open the link.");
      }
    })
    .catch((err) => console.error("An error occurred", err));
};

// Custom function to check password strength
const isStrongPassword = (password) => {
  const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/; // At least 1 uppercase, 1 number, 8 characters
  return regex.test(password);
};

export default function WelcomeScreen({ navigation }) {
  // State to track slideshow progress and render registration form
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slide content
  const slides = [
    {
      text: (
        <Text>
          <Text style={{ fontWeight: "bold" }}>Welcome to Forze! </Text>
          {"\n\n"}
          Our Mission is to enhance the physical and mental wellbeing of our
          community through football.
        </Text>
      ),
      image: require("../assets/Example Forze/1.jpg"), // Add the image for the first slide
    },
    {
      text: (
        <Text>
          <Text style={{ fontWeight: "bold" }}>Forze combats</Text> prominent
          issues in Belfast, such as{" "}
          <Text style={{ fontWeight: "bold" }}>loneliness and suicide.</Text>
        </Text>
      ),
      image: require("../assets/Example Forze/2.jpg"), // Add the image for the second slide
    },
    {
      text: (
        <Text>
          <Text style={{ fontWeight: "bold" }}>
            We fully support all the charities that are set up with the
            objective of saving lives and helping the community.
          </Text>
          {"\n\n"}
          We have created a close relationship with The Suicide and Awareness
          Support Group on the Falls Road.
        </Text>
      ),
      image: require("../assets/Example Forze/4.jpg"), // Add the image for the third slide
    },
    {
      text: (
        <Text>
          <Text style={{ fontWeight: "bold" }}>
            The founder of Forze is originally from Italy, but grew up in
            Belfast. His name is Samuele Quattromano.
          </Text>
          {"\n\n"}
          Noticing the lack of accessible football games for people out of
          school and university, he founded this company to encourage people to
          invest in both their mental and physical health through the beautiful
          game.
        </Text>
      ),
      image: require("../assets/Example Forze/3.jpg"), // Add the image for the fourth slide
    },
  ];

  // Function to move forward
  const handleNextSlide = () => {
    setCurrentSlide((prev) => prev + 1);
  };

  // Function to move backward
  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // REGISTER FUNCTIONS
  const [forename, setForename] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle user registration
  const handleRegister = async () => {
    if (!forename || !surname) {
      Alert.alert("Error", "Please enter both your forename and surname.");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Please enter a valid email.");
      return;
    }

    if (!isStrongPassword(password)) {
      Alert.alert(
        "Error",
        "Password must be at least 8 characters long, include one uppercase letter and one number."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Firebase Authentication - Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Send email verification
      const user = userCredential.user;
      await sendEmailVerification(user);

      // Write user document to Firestore
      const userDocRef = doc(firestore, "users", email); // Use email as the document ID
      await setDoc(userDocRef, {
        forename: forename,
        surname: surname,
        matches: [], // Initialize with an empty array
        isAdmin: false,
      });

      Alert.alert(
        "Registration Success",
        "A verification email has been sent to your email address. Please verify before logging in."
      );

      setLoading(false);
      navigation.navigate("Login"); // Navigate to login screen
    } catch (error) {
      setLoading(false);

      // Handle Firebase Auth errors
      switch (error.code) {
        case "auth/email-already-in-use":
          Alert.alert("Error", "Email is already in use.");
          break;
        case "auth/invalid-email":
          Alert.alert("Error", "Invalid email format.");
          break;
        case "auth/weak-password":
          Alert.alert(
            "Error",
            "Weak password. Please choose a stronger password."
          );
          break;
        default:
          Alert.alert("Error", error.message);
          break;
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Check if slideshow is active */}
      {currentSlide === 0 ? (
        <>
          {/* Main Welcome Content */}
          <Image
            source={require("../assets/Forze Logo.jpg")}
            style={{
              width: 200,
              height: 240,
              marginTop: -100,
              objectFit: "contain",
            }}
          />
          <Text style={styles.subtitle}>Strength through football.</Text>

          {/* "Are you new here?" Section */}
          <View style={styles.bottomSection}>
            <Text style={styles.sectionHeading}>Are you new here?</Text>
            <CustomButton
              title="Click here"
              onPress={() => setCurrentSlide(1)}
            />

            {/* "Already have an account?" Section */}
            <Text style={styles.sectionHeading}>Already have an account?</Text>
            <CustomButton
              title="Login"
              onPress={() => navigation.navigate("Login")}
            />
          </View>
        </>
      ) : currentSlide <= slides.length ? (
        <>
          {/* Slideshow Content */}
          <Image
            source={slides[currentSlide - 1].image} // Use the image from the slides array
            style={styles.slideImage} // You can customize this style to control the image size
          />
          <Text style={styles.slideText}>{slides[currentSlide - 1].text}</Text>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            {/* Back Button */}
            {currentSlide > 0 && (
              <TouchableOpacity onPress={handlePrevSlide}>
                <Text style={styles.arrow}>&lt;</Text>
              </TouchableOpacity>
            )}

            {/* Dot Indicator */}
            <View style={styles.dotContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentSlide === index + 1 && styles.activeDot, // Active dot
                  ]}
                />
              ))}
            </View>

            {/* Next Button */}
            <TouchableOpacity onPress={handleNextSlide}>
              <Text style={styles.arrow}>&gt;</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Registration Form */}
          <View style={styles.topSection}>
            <Text style={styles.formTitle}>Create an Account</Text>

            <TextInput
              style={styles.input}
              placeholder="First name"
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
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            {/* Password */}
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

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible} // Toggle visibility
              />
              <TouchableOpacity
                onPress={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                } // Toggle state
                style={styles.iconContainer}
              >
                <Ionicons
                  name={confirmPasswordVisible ? "eye" : "eye-off"}
                  size={24}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            {/* Loading indicator */}
            {loading && <ActivityIndicator size="large" color="#0000ff" />}

            {!loading && (
              <CustomButton title="Register" onPress={handleRegister} />
            )}
          </View>

          {/* Social logins */}
          {/* <Text style={styles.orText}>Alternatively, use one of these:</Text>

          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleAppleSignIn}
            >
              <Ionicons name="logo-apple" size={50} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleGoogleSignIn}
            >
              <Ionicons name="logo-google" size={50} color="#DB4437" />
            </TouchableOpacity>
          </View> */}

          <Image
            source={require("../assets/Forze Logo.jpg")}
            style={{
              width: 100,
              height: 100,
              marginTop: 260,
              objectFit: "contain",
            }}
          />

          {/* "Already have an account?" Section */}
          <View style={styles.bottomSection}>
            <Text style={styles.sectionHeading}>Already have an account?</Text>
            <CustomButton
              title="Login"
              onPress={() => navigation.navigate("Login")}
            />

            {/* Legal agreements at the bottom */}
            <Text style={styles.legalText}>
              By registering you are accepting our{" "}
              <Text
                style={styles.link}
                onPress={() => openLink("https://forzestf.com/rules")}
              >
                terms of use
              </Text>{" "}
              and{" "}
              <Text
                style={styles.link}
                onPress={() => openLink("https://forzestf.com/")}
              >
                privacy policy
              </Text>
              .
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    position: "relative", // Ensure that the container can position the dots correctly
    backgroundColor: "#FFCD00",
  },
  // mainTitle: { fontSize: 32, fontWeight: "bold", marginBottom: 10 }, // Obselete by logo image
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 5,
  },
  slideText: { fontSize: 18, textAlign: "center", marginBottom: 20 },
  slideImage: {
    width: 300, // Adjust width as needed
    height: 300, // Adjust height as needed
    marginBottom: 20, // Space between the image and the text
    borderRadius: 10, // Optional: To add rounded corners to the image
    objectFit: "contain", // Ensure the image fits within the given dimensions
    borderWidth: 8, // Outer black border width
    borderColor: "black", // Outer border color
    padding: 4, // White padding (acts like an inner border)
    backgroundColor: "white", // Inner white border background
  },
  navigationContainer: {
    position: "absolute", // Position it relative to the parent container
    bottom: 20, // 20 units from the bottom of the screen
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
  },
  arrow: { fontSize: 30, color: "#007AFF", paddingHorizontal: 20 },
  formTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
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

  // Dot progress indicator
  dotContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  activeDot: {
    width: 20,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF", // Blue color for active dot
  },

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

  // Bottom section (Are you new here?)
  topSection: {
    position: "absolute",
    top: 60, // Adjust distance from the bottom
    marginBottom: 20,
    alignItems: "center", // Center horizontally
    width: "100%",
  },

  bottomSection: {
    position: "absolute",
    bottom: 40, // Adjust distance from the bottom
    marginTop: 20,
    alignItems: "center", // Center horizontally
    width: "100%",
  },

  // Legal links
  legalText: {
    fontSize: 12,
    color: "#555",
    marginTop: 10,
  },

  link: {
    color: "#1E90FF", // Blue color for links
    textDecorationLine: "underline", // Underline the links
  },
});
