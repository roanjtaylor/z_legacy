import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";

// Global variables from discover with user details
import { globalEmail, globalMatches } from "./discover";

// Imports for Firestore reading
import { doc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Reference to the Firestore database

export default Schedule = ({ navigation, route }) => {
  // Adjust array to include only the matches the user has booked
  var bookedMatches = globalMatches.filter(userSignedUp);

  function userSignedUp(match) {
    // Filter function to only include the matches that the user (email) has signed up to.
    return match.users.includes(globalEmail);
  }

  // Remove user from match (and match from user) once sign-out button is pressed
  const removeUserFromMatch = async (match) => {
    // Remove the user from the match's booked users
    try {
      const docRef = await updateDoc(doc(db, "upcoming_matches", match.id), {
        BookedUsers: arrayRemove(globalEmail),
      });
      console.log("User removed from match's bookedUsers.");
    } catch (error) {
      console.error("Error removing user: ", error);
    }

    // Remove the match from the user's matches
    try {
      const docRef = await updateDoc(doc(db, "users", globalEmail), {
        Matches: arrayRemove(match.id),
      });
      console.log("Match removed from user's booked matches.");
    } catch (error) {
      console.error("Error removing match: ", error);
    }

    Alert.alert(
      "Match Removed!",
      "You were successfully removed from that match.",
      { text: "OK" }
    );
  };

  // Pull to Refresh
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    bookedMatches = globalMatches.filter(userSignedUp); // Refreshes the booked match data

    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // Utilities for FlatList
  const myItemSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          backgroundColor: "grey",
          width: "100%",
          marginTop: 10,
          marginBottom: 10,
        }}
      />
    );
  };

  const myListEmpty = () => {
    return (
      <View
        style={{
          width: "100%",
          backgroundColor: "brown",
          marginTop: 10,
        }}
      >
        <Text style={styles.subtitle}>
          Pull to refresh... (Refresh discover to save changes)
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Schedule:</Text>
        <Text style={styles.subtitle}>
          View the matches that you have booked!
        </Text>
      </View>

      {/* Scrollable chronology of upcoming matches */}
      <View style={styles.scrollView}>
        <FlatList
          data={bookedMatches}
          renderItem={(
            { item } // Loops through array, rendering each element
          ) => (
            <View
              style={{
                marginTop: 10,
                marginBottom: 10,
                padding: "7%",
                flexBasis: "auto", // Sets height to fit the content
                width: "100%",
                backgroundColor: "#413C3D",
              }}
            >
              <Text style={styles.matchesTitle}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.date}</Text>
              <Text style={styles.subtitle}>
                {item.users.length} / {item.capacity} Players
              </Text>
              <Text style={styles.subtitle}>
                Cost per Player: £{item.pricepp}.
              </Text>
              <Text style={styles.subtitle}>{item.description}</Text>
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  backgroundColor: "pink",
                  padding: 10,
                  margin: 10,
                  borderRadius: 100,
                }}
                onPress={() => removeUserFromMatch(item)}
              >
                <Text>Sign-Out of this Match.</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={myItemSeparator}
          ListEmptyComponent={myListEmpty}
          ListHeaderComponent={() => (
            <Text style={styles.matchesTitle}>Your Booked Matches:</Text>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              style={{ tintColor: "white", colors: "white" }} // Colour of wheel on iOS + Android
            />
          }
          extraData={refreshing}
        />
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

  scrollView: {
    width: "100%",
    flex: 1, // Does the job to ensure all are visible
    paddingTop: "7%",
    backgroundColor: "rgb(35, 31, 32)", // Charcoal grey
    // BGCOLOUR FOR MATCH CLICKABLES "#413C3D", // Lighter gray
    fontSize: 22, // Font size of text within input field
  },

  matchesTitle: {
    fontSize: 22,
    fontWeight: "500",
    color: "rgb(0,225,130)", // turqoise green
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "white",
    paddingLeft: "7%",
  },
});
