import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";

export default function Tutorial() {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Tutorial:</Text>

      <Text style={styles.tutorialContent}>
        This app is designed to make site visiting safer. It aumates the process
        of informing others of your whereabouts, so that if an incident occurs
        then the appropriate person can be notified sooner.
      </Text>

      <Text style={styles.tutorialContent}>
        It has been designed to be easy to understand.
      </Text>

      <Text style={styles.tutorialContent}>Time to create an account.</Text>

      <Link href="/." asChild>
        <TouchableOpacity style={styles.bButton}>
          <Text style={styles.bbText}>Okay</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  // Overall container for the screen
  container: {
    flex: 1,
    alignItems: "center", // Centre all content
    justifyContent: "center",
    backgroundColor: "rgb(75, 75, 75)",
  },

  // Tutorial title text
  titleText: {
    fontWeight: "bold",
    textDecorationLine: "underline",
    fontSize: 32,
    color: "white",
  },

  // Text content
  tutorialContent: {
    fontWeight: "500",
    fontSize: 28,
    margin: 20,
    marginBottom: 10,
    color: "white",
    textAlign: "center",
  },

  // Login button
  bButton: {
    backgroundColor: "black",
    width: Dimensions.get("window").width * 0.75,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    alignItems: "center", // Parent, so aligns Children (TEXT) centrally
  },

  bbText: {
    fontWeight: "bold",
    fontSize: 32,
    color: "white",
  },
});
