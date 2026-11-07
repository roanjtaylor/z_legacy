import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";

import { Link } from "expo-router"; // For navigating between the screens

import { LinearGradient } from "expo-linear-gradient"; // Library for Background gradient
import taggartsLogo from "../assets/taggarts-logo.png";

export default function Index() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgb(255,80,80)", "transparent", "rgba(0,0,0,0.8)"]}
        style={styles.backgroundGradient}
      >
        <Image source={taggartsLogo} style={styles.logoImage} />

        <Text style={styles.titleText}>Safe-Site Mobile App.</Text>

        {/* Needed the asChild button to get it working for some reason */}
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.bButton}>
            <Text style={styles.bbText}>Login</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/register" asChild>
          <TouchableOpacity style={styles.bButton}>
            <Text style={styles.bbText}>Register</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/tutorial" asChild>
          <TouchableOpacity style={styles.rButton}>
            <Text style={styles.rbText}>?</Text>
          </TouchableOpacity>
        </Link>

        <Text style={styles.versionText}>Version 1: July 2024.</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  // Overall container for the screen
  container: {
    flex: 1,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },

  // Gradient background
  backgroundGradient: {
    // position: 'absolute',
    // left: 0,
    // right: 0,
    // top: 0,
    height: Dimensions.get("window").height,
    alignItems: "center", // All content in gradient, thus parent
  },

  // Taggarts logo header
  logoImage: {
    tintColor: "white", // Makes logo white
    width: Dimensions.get("window").width - 20,
    resizeMode: "contain",
  },

  // Safe Site title text
  titleText: {
    fontWeight: "bold",
    fontSize: 28,
  },

  // Login and CreateAnAccount buttons
  bButton: {
    backgroundColor: "black",
    width: Dimensions.get("window").width - 125,
    marginTop: 50,
    padding: 30,
    borderRadius: 10,
    alignItems: "center", // Parent, so aligns Children (TEXT) centrally
  },

  bbText: {
    fontWeight: "bold",
    fontSize: 32,
    color: "white",
  },

  // Help button
  rButton: {
    backgroundColor: "rgb(255,78,71)",
    marginTop: 25,
    marginBottom: 25,
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "black",
    alignItems: "center", // Parent, so aligns Children (TEXT) centrally
    justifyContent: "center", // Align TEXT vertically centrally
  },

  rbText: {
    fontWeight: "bold",
    fontSize: 32,
    color: "white",
  },

  versionText: {
    fontWeight: "bold",
    color: "grey",
  },
});
