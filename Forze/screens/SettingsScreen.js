import React from "react";
import { View } from "react-native";
import { useUser } from "../contexts/UserContext";

// For match management
import AdminView from "../components/AdminSettingsScreen";
import UserView from "../components/UserSettingsScreen";

export default function SettingsScreen({ navigation }) {
  const { user, reloadUser, loading } = useUser();

  return (
    <View style={{ height: "100%", width: "100%" }}>
      {/* Check if the user is an admin */}
      {user?.isAdmin ? (
        <AdminView
          navigation={navigation}
          user={user}
          reloadUser={reloadUser}
        />
      ) : (
        <UserView navigation={navigation} user={user} reloadUser={reloadUser} />
      )}
    </View>
  );
}
