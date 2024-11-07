import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from "react-native";

// Global variables from discover with user details
var globalEmail;
import { globalMatches } from "./discover"; // Require cycle- not ideal but not harmful for now. Future refactor.

// Imports for Firestore reading
import { doc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Reference to the Firestore database

export default Schedule = ({ navigation, route }) => {
  // Get email from parameters
  const { email } = route.params;
  globalEmail = email;

  // Adjust array to include only the matches the user has booked
  var bookedMatches = globalMatches.filter(userSignedUp);

  function userSignedUp(match) {
    // Filter function to only include the matches that the user (email) has signed up to.
    return match.users.includes(globalEmail);
  }

  // // Remove user from match (and match from user) once sign-out button is pressed
  // const removeUserFromMatch = async (match) => {
  //   // Remove the user from the match's booked users
  //   try {
  //     const docRef = await updateDoc(doc(db, "upcoming_matches", match.id), {
  //       BookedUsers: arrayRemove(globalEmail),
  //     });
  //     console.log("User removed from match's bookedUsers.");
  //   } catch (error) {
  //     console.error("Error removing user: ", error);
  //   }

  //   // Remove the match from the user's matches
  //   try {
  //     const docRef = await updateDoc(doc(db, "users", globalEmail), {
  //       Matches: arrayRemove(match.id),
  //     });
  //     console.log("Match removed from user's booked matches.");
  //   } catch (error) {
  //     console.error("Error removing match: ", error);
  //   }

  //   Alert.alert(
  //     "Match Removed!",
  //     "You were successfully removed from that match.",
  //     { text: "OK" }
  //   );
  // };

  // Pull to Refresh
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    bookedMatches = globalMatches.filter(userSignedUp); // Refreshes the booked match data

    // console.log(globalMatches[0].name);

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
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
          width: "100%",
          paddingVertical: 20,
          paddingHorizontal: 10,
          marginTop: "7%",
        }}
      >
        <Text
          style={{
            color: "#0000EE",
            fontSize: 16,
            textAlign: "center",
          }}
        >
          {refreshing
            ? "Loading..."
            : "You have no booked matches, or haven't refreshed the discover screen."}
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
          View the matches that you have booked.
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
              <Image
                source={{ uri: item.imageURL }}
                style={{ alignSelf: "center", width: 300, height: 300 }}
              />
              {/* <TouchableOpacity
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
              </TouchableOpacity> */}
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
    height: "15%",
    paddingTop: "7%",
    backgroundColor: "rgb(35, 31, 32)", // charcoal grey
    borderBottomColor: "#a4a3a3", // Light gray, as from Figma
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 20, // so visible on IPhone X
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
