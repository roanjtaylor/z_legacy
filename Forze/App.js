import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./navigation/AuthNavigator";

export default function App() {
  return (
    <NavigationContainer>
      {/* Authentication navigator as screens prior to user authentication (login) */}
      <AuthNavigator />
    </NavigationContainer>
  );
}
