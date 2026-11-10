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

export default function Login() {
  const [email, setEmail] = React.useState();
  const [password, setPassword] = React.useState();

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Login:</Text>

      <Text style={styles.fieldLabel}>Email address</Text>
      <TextInput
        style={styles.inputField}
        onChangeText={setEmail}
        value={email}
        placeholder="> Enter your Taggarts' email address"
      />

      <Text style={styles.fieldLabel}>Password</Text>
      <TextInput
        style={styles.inputField}
        onChangeText={setPassword}
        value={password}
        placeholder="> Enter your password"
        secureTextEntry={true}
      />

      {/* WILL NEED TO BE CONNECTED TO THE USER'S PROFILE */}
      <Link href="/" asChild>
        <TouchableOpacity style={styles.bButton}>
          <Text style={styles.bbText}>Login</Text>
        </TouchableOpacity>
      </Link>

      {/** 'replace' used to Pop current screen and Push the one in the URL **/}
      <Link replace href={"./register"} style={styles.registerLink}>
        Need to Register?
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
    backgroundColor: "rgb(255,146,146)",
  },

  // Login title text
  titleText: {
    fontWeight: "bold",
    textDecorationLine: "underline",
    fontSize: 32,
    color: "white",
  },

  // Email and Password fields
  fieldLabel: {
    fontWeight: "bold",
    fontSize: 28,
    alignSelf: "left",
    margin: 20,
  },

  inputField: {
    backgroundColor: "white",
    width: Dimensions.get("window").width - 40,
    padding: 15,
    borderRadius: 10,
  },

  // Login button
  bButton: {
    backgroundColor: "black",
    width: Dimensions.get("window").width * 0.75,
    marginTop: 50,
    padding: 20,
    borderRadius: 10,
    alignItems: "center", // Parent, so aligns Children (TEXT) centrally
  },

  bbText: {
    fontWeight: "bold",
    fontSize: 32,
    color: "white",
  },

  // Register navigation link
  registerLink: {
    fontStyle: "italic",
    textDecorationLine: "underline",
    fontSize: 20,
    color: "white",
    marginTop: 30,
  },
});
