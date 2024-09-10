import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";

// Libraries for specific components
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; // Bottom tab navigator

// Screens for the other tabs
import PitchScreen from "./pitch";
import CommunityScreen from "./community";
import ScheduleScreen from "./schedule";
import ProfileScreen from "./profile";

// Imports for Firestore reading
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Reference to the Firestore database

// Global variables for storing the user's details
export var globalEmail, globalPassword, globalName, globalQuery;
export var globalMatches = new Array();

export default Discover = ({ navigation, route }) => {
  // Parameters stored that were passed through by the Login screen
  const { userEmail, userPassword } = route.params;
  globalEmail = userEmail;
  globalPassword = userPassword;
  globalName = userEmail.split("@")[0]; // Get the prefix of the Email to initialise the user's forename

  // Bottom tab navigator for user navigation
  const BottomTabNav = createBottomTabNavigator();

  return (
    // Tab Navigator for the user's screens
    <BottomTabNav.Navigator
      screenOptions={() => ({
        headerShown: false, // Hide header ("Discover")
        tabBarStyle: {
          backgroundColor: "rgba(34,36,40,1)", // Grey background of the tabNavigator
          borderTopWidth: 0, // Removes the little white line above the tabs
        },
        tabBarActiveTintColor: "rgb(0,225,130)", // Turqoise green for the Active Tab
        tabBarInactiveTintColor: "grey",
      })}
    >
      <BottomTabNav.Screen name="Discover" component={DiscoverScreen} />
      <BottomTabNav.Screen name="Pitch" component={PitchScreen} />
      <BottomTabNav.Screen name="Community" component={CommunityScreen} />
      <BottomTabNav.Screen name="Schedule" component={ScheduleScreen} />
      <BottomTabNav.Screen name="Profile" component={ProfileScreen} />
    </BottomTabNav.Navigator>
  );
};

const retrieveData = async () => {
  // Reset the array to only show what is currently in the store (no duplicates)
  globalMatches = new Array();

  // Retrieve all upcoming matches in the (same named) collection
  globalQuery = await getDocs(
    query(collection(db, "upcoming_matches"), where("Active", "==", true))
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

function DiscoverScreen() {
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
        <Text style={styles.title}>Hello {globalName}!</Text>
        <Text style={styles.subtitle}>Discover your next game.</Text>
      </View>

      {/* Scrollable chronology of upcoming matches */}
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
                Cost per Player: £{item.pricepp}.
              </Text>
              <Text style={styles.subtitle}>{item.description}</Text>
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  backgroundColor: "cyan",
                  padding: 10,
                  margin: 10,
                  borderRadius: 100,
                }}
                onPress={() => item.signUpUser()}
              >
                <Text>Sign-Up for this Match!</Text>
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
}

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

  signUpUser() {
    if (this.users.length == this.capacity) {
      // Match is Full, so user cannot sign up for it
      Alert.alert(
        "Match Full!",
        "Sadly that match is full, you cannot sign up for it",
        { text: "OK" }
      );
    } else {
      // Space is available, so can sign up the user!
      Alert.alert(
        "Confirmation required.",
        "Are you sure you want to sign up for this game at ".concat(
          this.name,
          "?"
        ),
        [
          {
            text: "Yes",
            onPress: () => this.writeUserToDB(), // Attempt to write user to DB (Alert if already in, or if successful)
          },
          {
            text: "Cancel",
          },
        ]
      );
    }
  }

  writeUserToDB = async () => {
    // Check if user is in the booked users
    if (this.users.includes(globalEmail)) {
      // User already signed up, Alert the user.
      // TESTING NOTE: includes() is case sensitive- may need to adjust email login so that all lowercase as uppercase start changes the value
      Alert.alert("Signup Error.", "You're already signed up for this game!", [
        {
          text: "OK",
        },
      ]);
    } else {
      // User not signed up yet, write user to the database.
      // Write the username into the bookedUsers array in this match
      this.users.push(globalEmail);

      // Update current match in Firestore.
      try {
        const docRef = await updateDoc(doc(db, "upcoming_matches", this.id), {
          BookedUsers: this.users,
        });
        console.log("Upload successful!");
      } catch (error) {
        console.error("Error adding document: ", error);
      }

      // Write the match ID into the user's bookedMatches
      // Try to get the user and store in variable
      const userQuery = await getDoc(doc(db, "users", globalEmail));

      if (userQuery.exists()) {
        // If found, append upcomingMatches array
        const updatedMatches = userQuery.data().Matches;
        updatedMatches.push(this.id);

        // Write updated user to database
        try {
          const docRef = await updateDoc(doc(db, "users", globalEmail), {
            Matches: updatedMatches,
          });
          console.log("Upload of match to user successful!");
        } catch (error) {
          console.error("Error adding document: ", error);
        }
      } else {
        // If not, write a new document with email, upcomingMatches array (+ this match)
        try {
          // Logic to write to the Firestore database
          const docRef = await setDoc(doc(db, "users", globalEmail), {
            Matches: [this.id],
          });
          console.log("Upload of match to user successful!");
        } catch (error) {
          console.error("Error adding document: ", error);
        }
        console.log("User not found, so written.");
      }
    }
  };
}

class User {
  constructor(id, matches) {
    this.id = id;
    this.matches = matches;
  }
}

// Match details screen
function MatchDetailsScreen(match) {}

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

  // ==================== FIELD SCREEN ====================
  fieldFixedView: {
    flex: 0.2, // Uses 1/5 of the screen (Excluding the TabNavigator)
    position: "relative", // relative to the parent view, so 35% of screen
    paddingTop: 24,
    backgroundColor: "rgb(35, 31, 32)", // charcoal grey
  },

  fieldGreeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#a4a3a3", // Light gray, as from Figma
    paddingLeft: 24,
  },

  fieldInputLarge: {
    height: 40,
    width: "90%",
    margin: 20, // 20px all round
    borderRadius: 10,
    paddingLeft: 10,
    backgroundColor: "#413C3D", // Lighter gray

    fontSize: 22, // Font size of text within input field
    color: "white", // Colour of INPUTTED text
  },

  fieldMapView: {
    flex: 0.8, // Uses rest of the screen (Excluding the TabNavigator)
    position: "relative", // relative to the parent view
    backgroundColor: "red", // charcoal grey
  },

  fieldMap: {
    flex: 1,
  },

  // ==================== COMMUNITY SCREEN ====================
  comsFixedView: {
    flex: 0.2, // Uses 1/5 of the screen (Excluding the TabNavigator)
    position: "relative", // relative to the parent view, so 35% of screen
    paddingTop: 24,
    backgroundColor: "rgb(35, 31, 32)", // charcoal grey
  },

  comsGreeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#a4a3a3", // Light gray, as from Figma
    paddingLeft: 24,
  },

  comsInstruction: {
    fontSize: 18,
    fontWeight: "400",
    color: "white",
    paddingLeft: 24,
  },

  comsScrollable: {
    flex: 0.8, // Uses 4/5 of the screen (Excluding the TabNavigator)
    position: "relative", // relative to the parent view, so 35% of screen
    backgroundColor: "#1c191a", // same colour as picture to look better when at max scroll
  },

  // ==================== SCHEDULE SCREEN ====================
  scheduleFixedView: {
    flex: 0.08,
    position: "relative",
    paddingTop: 24,
    backgroundColor: "rgb(35, 31, 32)", // charcoal grey
  },

  scheduleGreeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#a4a3a3", // Light gray, as from Figma
    paddingLeft: 24,
  },

  scheduleScrollable: {
    flex: 0.92,
    position: "relative",
    backgroundColor: "#1c191a", // same colour as picture to look better when at max scroll
  },

  scheduleFillerImage: {
    width: "100%",
    resizeMode: "contain",
  },

  scheduleGArrow: {
    width: 24,
    height: 24,
  },

  // ==================== PROFILE SCREEN ====================
  profileFixedView: {
    flex: 0.08,
    position: "relative",
    paddingTop: 24,
    backgroundColor: "rgb(35, 31, 32)", // charcoal grey
  },

  profileGreeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#a4a3a3", // Light gray, as from Figma
    paddingLeft: 24,
  },

  profileScrollable: {
    flex: 0.92,
    position: "relative",
    backgroundColor: "#1c191a", // same colour as picture to look better when at max scroll
  },

  profileFillerImage: {
    marginTop: 20,
    width: "100%",
    resizeMode: "contain",
  },

  logoutOpacity: {
    // "Logout" button
    padding: 15,
    backgroundColor: "rgb(0,225,130)", // turqoise green
    borderRadius: 100,
    margin: 20,
  },

  logoutText: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "white",
  },

  profileGArrow: {
    width: 24,
    height: 24,
    backgroundColor: "white",
    borderRadius: 10,
  },
});
