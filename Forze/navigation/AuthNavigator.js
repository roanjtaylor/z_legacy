import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import TabNavigator from "./TabNavigator";

import { UserProvider } from "../contexts/UserContext"; // Import UserProvider

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_left" }}
    >
      {/* Authentication screens */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          presentation: "modal", // Show LoginScreen as a modal
        }}
      />

      <Stack.Screen name="Main">
        {() => (
          <UserProvider>
            <TabNavigator />
          </UserProvider>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
