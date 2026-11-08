import React from "react";
import { View } from "react-native";
import { useUser } from "../contexts/UserContext";

// For match uploads
import AdminView from "../components/AdminGamesScreen";
import UserView from "../components/UserGamesScreen";

export default function GamesScreen() {
  const { user, reloadUser, loading } = useUser();

  return (
    <View style={{ height: "100%", width: "100%" }}>
      {/* Check if the user is an admin */}
      {user?.isAdmin ? (
        <AdminView user={user} reloadUser={reloadUser} />
      ) : (
        <UserView user={user} reloadUser={reloadUser} />
      )}
    </View>
  );
}
