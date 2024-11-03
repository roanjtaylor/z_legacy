import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";

// Green Arrow for "Sign Out" button
import GreenArrow from "../../assets/global/GreenArrow.png";

// Firebase authentication for deleting
import { auth } from "../../firebaseConfig"; // Reference to the Firebase KONI project
import { deleteUser } from "firebase/auth"; // Functions for Authentication (downloaded in the Firebase JS SDK)

// Imports for Firestore deleting
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Reference to the Firestore database

// KickOffNI logo for space filler
import KONILogo from "../../assets/welcome/TransparentLogo.png";

export default Profile = ({ navigation, route }) => {
  // Profile details
  const { email } = route.params;
  const [inputEmail, setEmail] = React.useState();

  const signOut = () => {
    navigation.goBack(); // to discover screen
    navigation.goBack(); // to welcome screen
  };

  const updateUserEmail = async () => {
    // ** NEED TO MAKE THIS DOWN THE LINE TO BE IN LINE WITH THE DPA***
    // Update user email in Authentication
    // Update user email in Firestore
  };

  const deleteAccount = () => {
    // Confirm user wants to delete their account
    Alert.alert(
      "Confirmation required",
      "Are you sure you want to delete your account?",
      [
        {
          text: "Yes",
          onPress: () => deleteUserFromDB(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const deleteUserFromDB = async () => {
    // Delete user from Firestore
    await deleteDoc(doc(db, "users", email));

    // Delete all user instances from Matches
    // ** NEED TO MAKE THIS DOWN THE LINE TO BE IN LINE WITH THE DPA***

    // Delete user from Authentication
    const user = auth.currentUser;
    user
      .delete()
      .then(() => {
        Alert.alert("Account successfully deleted");
        navigation.goBack(); // to discover screen
        navigation.goBack(); // to welcome screen
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile:</Text>
        <Text style={styles.subtitle}>
          View and potentially delete your details.
        </Text>
      </View>

      {/* Details */}
      <Text style={styles.scrollLabel}>Email:</Text>
      <Text style={styles.Tsubtitle}>{email}</Text>

      {/* KickOffNI logo as a space filler for now */}
      <Image style={styles.image} source={KONILogo} />

      {/* Help */}
      <Text style={styles.scrollLabel}>Contact KickOffNI:</Text>
      <Text style={styles.Tsubtitle}>kickoffnihelp@gmail.com</Text>

      {/* Sign out button */}
      <TouchableOpacity style={styles.signOut} onPress={() => signOut()}>
        <Text style={styles.signOutText}>
          Sign Out <Image source={GreenArrow} style={styles.gArrow} />
        </Text>
      </TouchableOpacity>

      {/* <TouchableOpacity
        style={styles.signOut}
        onPress={() => updateUserEmail()}
      >
        <Text style={styles.signOutText}>Update email</Text>
      </TouchableOpacity> */}

      <TouchableOpacity style={styles.delete} onPress={() => deleteAccount()}>
        <Text style={styles.signOutText}>Delete account X</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    paddingLeft: "7%", // Space that is not the screen- blank space for ease of layouts
    paddingRight: "7%",
    alignItems: "center", // Horizontally centers all content
    backgroundColor: "rgb(35, 31, 32)", // Charcoal grey
  },

  header: {
    width: "117%",
    height: "15%",
    paddingTop: "7%",
    backgroundColor: "rgb(35, 31, 32)", // charcoal grey
    // backgroundColor: "red",
    borderBottomColor: "#a4a3a3", // Light gray, as from Figma
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 20, // so visible on IPhone X
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#a4a3a3", // Light gray, as from Figma
    paddingLeft: "7%", // Matching component padding in container
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "white",
    paddingLeft: "7%",
  },

  // Profile details
  scrollLabel: {
    fontSize: 18,
    fontWeight: "400",
    color: "rgb(0,225,130)", // turqoise green
    marginTop: "7%",
  },

  Tsubtitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "white",
  },

  textInput: {
    height: 40,
    borderWidth: 1,
    padding: "7%",
  },

  // Image
  image: {
    objectFit: "fill",
    width: "40%",
    height: "25%",
    marginTop: "10%",
  },

  // "Sign Out" button
  signOut: {
    alignSelf: "center",
    marginTop: "7%",
    width: "100%",
    padding: "5%",
    backgroundColor: "rgb(0,225,130)", // turqoise green
    borderRadius: "100%",
  },

  signOutText: {
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

  delete: {
    alignSelf: "center",
    marginTop: "7%",
    width: "100%",
    padding: "5%",
    backgroundColor: "rgb(225, 0, 95)", // complimentary pinky red
    borderRadius: "100%",
  },
});
