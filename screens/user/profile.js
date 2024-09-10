import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

// Green Arrow for "Sign Out" button
import GreenArrow from "../../assets/global/GreenArrow.png";

export default Profile = ({ navigation, route }) => {
  const signOut = () => {
    navigation.goBack(); // to discover screen
    navigation.goBack(); // to welcome screen
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile:</Text>
        <Text style={styles.subtitle}>Coming soon!</Text>
      </View>

      {/* Details */}
      <TouchableOpacity style={styles.signOut} onPress={() => signOut()}>
        <Text style={styles.signOutText}>
          Sign Out <Image source={GreenArrow} style={styles.gArrow} />
        </Text>
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
    height: "20%", // Looks about ~1/4 of screen. Needs checked and clarified.
    paddingTop: "7%",
    backgroundColor: "rgb(35, 31, 32)", // charcoal grey
    // backgroundColor: "red",
    borderBottomColor: "#a4a3a3", // Light gray, as from Figma
    borderBottomWidth: StyleSheet.hairlineWidth,
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
});
