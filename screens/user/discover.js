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
  Image,
} from "react-native";

// Libraries for specific components
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; // Bottom tab navigator
// Libraries for Stack Navigator
import { NavigationContainer } from "@react-navigation/native"; // identify navigator
import { createNativeStackNavigator } from "@react-navigation/native-stack"; // create stack

// Screens for the other tabs
import PitchScreen from "./pitch";
import CommunityScreen from "./community";
import ScheduleScreen from "./schedule";
import ProfileScreen from "./profile";
import PayHandler from "../../components/payHandler";

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
  orderBy,
  documentId,
} from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Reference to the Firestore database

// Imports for Firebase Storage
import { getStorage, ref, getDownloadURL } from "firebase/storage";

// Imports for navigation bar icons
import FontAwesome from "@expo/vector-icons/FontAwesome"; // Search + Calendar
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"; // Pitch
import MaterialIcons from "@expo/vector-icons/MaterialIcons"; // Profile

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
      <BottomTabNav.Screen
        name="Discover"
        component={DiscoverStack}
        options={() => ({
          tabBarIcon: ({ focused }) => (
            <FontAwesome
              name="search"
              size={24}
              color={focused ? "rgb(0,225,130)" : "grey"}
            /> // Changes icon's colour, turquoise green if active, grey if not.
          ),
        })}
      />
      {/* <BottomTabNav.Screen
        name="Pitch"
        component={PitchScreen}
        options={() => ({
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="soccer-field"
              size={24}
              color={focused ? "rgb(0,225,130)" : "grey"}
            />
          ),
        })}
      /> */}
      {/* <BottomTabNav.Screen name="Community" component={CommunityScreen} /> */}
      <BottomTabNav.Screen
        name="Schedule"
        component={ScheduleScreen}
        initialParams={{ email: globalEmail }}
        options={() => ({
          tabBarIcon: ({ focused }) => (
            <FontAwesome
              name="calendar"
              size={24}
              color={focused ? "rgb(0,225,130)" : "grey"}
            />
          ),
        })}
      />
      <BottomTabNav.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ email: globalEmail }}
        options={() => ({
          tabBarIcon: ({ focused }) => (
            <MaterialIcons
              name="account-circle"
              size={24}
              color={focused ? "rgb(0,225,130)" : "grey"}
            />
          ),
        })}
      />
    </BottomTabNav.Navigator>
  );
};

const retrieveData = async () => {
  // Reset the array to only show what is currently in the store (no duplicates)
  globalMatches = new Array();

  // Retrieve all upcoming matches in the (same named) collection
  globalQuery = await getDocs(
    query(
      collection(db, "matches"),
      where("Active", "==", true),
      orderBy("DateAndTime")
    )
  );
  globalQuery.forEach(async (doc) => {
    // doc.data() is never undefined for query doc snapshots
    // console.log(doc.id, " => ", doc.data()); // Prints all the data found.

    // Get image, store in match
    var storage = getStorage();
    var storageRef = ref(storage, "images/" + doc.id);
    var url = await getDownloadURL(storageRef);

    console.log("DOCUMENT FETCHED: ", doc.id);

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
        doc.id,
        url
      )
    );
  });
  console.log("===");
};

const Stack = createNativeStackNavigator();

function DiscoverStack() {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator>
        <Stack.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PayHandler"
          component={PayHandler}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function DiscoverScreen({ navigation }) {
  // Read in the active matches from the Firestore.
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
        <TouchableOpacity
          style={{
            alignItems: "center",
            backgroundColor: "yellow",
            padding: 10,
            margin: 10,
          }}
          onPress={() => onRefresh()}
        >
          <Text>Click to load, or scroll this page!</Text>
        </TouchableOpacity>
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
            { item } // Loops through array, rendering each Match
          ) => (
            // Tried to rename to match, but results in an error- must require item as a keyword??
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

              <TouchableOpacity
                style={{
                  alignItems: "center",
                  backgroundColor: "cyan",
                  padding: 10,
                  margin: 10,
                  borderRadius: 100,
                }}
                onPress={() =>
                  navigation.push("PayHandler", {
                    match: item,
                    email: globalEmail,
                  })
                } // Call function, passing in necessary parameters, to carry out the money management????
              >
                <Text>VIEW MORE</Text>
              </TouchableOpacity>

              {/* Modal that shows when button pressed */}
              {/* <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
              >
                <PayHandler match={item} email={globalEmail} />
              </Modal> */}
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
  constructor(
    users,
    date,
    description,
    location,
    capacity,
    pricepp,
    name,
    id,
    imageURL
  ) {
    this.users = users; // Sets array equal to the booked users
    this.date = date;
    this.description = description;
    this.location = location;
    this.capacity = capacity;
    this.pricepp = pricepp;
    this.name = name;
    this.id = id;
    this.imageURL = imageURL;
  }
}

class User {
  constructor(id, matches) {
    this.id = id;
    this.matches = matches;
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
    height: "15%",
    paddingTop: "7%",
    backgroundColor: "rgb(35, 31, 32)", // charcoal grey
    borderBottomColor: "#a4a3a3", // Light gray, as from Figma
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 20,
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
    fontSize: 22, // Font size of text within input field
  },

  matchesTitle: {
    fontSize: 22,
    fontWeight: "500",
    color: "rgb(0,225,130)", // turqoise green
  },
});
