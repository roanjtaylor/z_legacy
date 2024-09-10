import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet } from "react-native";

export default Community = ({ navigation, route }) => {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community:</Text>
        <Text style={styles.subtitle}>Coming soon!</Text>
      </View>
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
});
