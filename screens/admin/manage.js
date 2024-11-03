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

// Imports for Firestore reading
import {
  collection,
  getDocs,
  where,
  updateDoc,
  doc,
  query,
} from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Reference to the Firestore database

var globalMatches;

// Get the match data from Firestore
const retrieveData = async () => {
  // Reset the array to only show what is currently in the store (no duplicates)
  globalMatches = new Array();

  // Retrieve all matches in the (same named) collection
  globalQuery = await getDocs(
    query(collection(db, "matches"), where("Active", "==", true))
  );
  globalQuery.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    // console.log(doc.id, " => ", doc.data()); // Prints all the data found.

    // Make a match object, add to global array
    globalMatches.push(
      new Match(
        doc.data().BookedUsers,
        doc.data().DateAndTime,
        doc.data().Description,
        doc.data().Location,
        doc.data().MaxPlayers,
        doc.data().PricePerPlayer,
        doc.data().Name,
        doc.id
      )
    );
  });
};

const deactivateMatch = async (match) => {
  // Set Active to false, and refresh screent to show changes (as this match has been removed)
  try {
    const docRef = await updateDoc(doc(db, "matches", match.id), {
      Active: false,
    });
    console.log("Match deactivated.");
  } catch (error) {
    console.error("Error deactivating that match: ", error);
  }

  Alert.alert(
    "Match Deactivated!",
    "You successfully deactivated that match.",
    { text: "OK" }
  );
};

export default Manage = ({ navigation }) => {
  // Read in the upcoming matches from the Firestore.
  // Pull to Refresh
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    retrieveData(); // Refreshes the match data

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
        <Text style={styles.subtitle}>Pull to refresh...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Manage bookings:</Text>
        <Text style={styles.subtitle}>
          Click on the bookings to view their information.
        </Text>
      </View>

      {/* Scrollable with the matches */}
      <View style={styles.scrollView}>
        <FlatList
          data={globalMatches}
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
                Cost per Player: £{item.pricepp}
              </Text>
              <Text style={styles.subtitle}>Emails of Booked Users:</Text>

              {/* Flatlist to display booked users */}
              <FlatList
                data={item.users} // booked users in the match
                renderItem={({ email, index }) => {
                  // unique name of email given to each element in booked users
                  return (
                    <View>
                      <Text style={styles.subtitle}>
                        {/* Not too sure how this works, probably not incredibly efficient, but it works! Shows the emails! */}
                        {index + 1}. {item.users[index]}
                      </Text>
                    </View>
                  );
                }}
                keyExtractor={(email) => email}
              />

              {/* Button to set match to inactive (remove from discovery screen) */}
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  backgroundColor: "yellow",
                  padding: 10,
                  margin: 10,
                  borderRadius: 100,
                }}
                onPress={() => deactivateMatch(item)}
              >
                <Text>Match is complete.</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={myItemSeparator}
          ListEmptyComponent={myListEmpty}
          ListHeaderComponent={() => (
            <Text style={styles.matchesTitle}>Upcoming Matches:</Text>
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

// Class definition to store the matches
class Match {
  constructor(users, date, description, location, capacity, pricepp, name, id) {
    this.users = users; // Sets array equal to the booked users
    this.date = date;
    this.description = description;
    this.location = location;
    this.capacity = capacity;
    this.pricepp = pricepp;
    this.name = name;
    this.id = id;
  }
}

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
