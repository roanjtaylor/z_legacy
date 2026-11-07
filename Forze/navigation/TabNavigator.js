import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, FontAwesome } from "react-native-vector-icons"; // Importing the icons
import { useUser } from "../contexts/UserContext";

// Screens (shown on clicking the tabs)
import GamesScreen from "../screens/GamesScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { user, reloadUser, loading } = useUser();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Games"
        component={GamesScreen}
        options={{
          tabBarLabel: user?.isAdmin ? "Upload Games" : "Find Battles",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="soccer-ball-o" size={size} color={color} /> // Football pitch icon
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarLabel: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} /> // Calendar icon
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} /> // Profile icon
          ),
        }}
      />
    </Tab.Navigator>
  );
}
