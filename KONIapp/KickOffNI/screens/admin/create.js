import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Button,
  Alert,
} from "react-native";

// Libraries for specific components
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; // Bottom tab navigator
import DateTimePicker from "@react-native-community/datetimepicker"; // Date Time picker

// Imports for Firestore uploading
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Reference to the Firestore database

// Imports for Firebase Storage
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

// Screens for the other tabs
import ManageScreen from "./manage";
import ProfileScreen from "./profile";

// Green Arrow for "Upload" button
import GreenArrow from "../../assets/global/GreenArrow.png";

// Imports for navigation bar icons
import AntDesign from "@expo/vector-icons/AntDesign"; // Create
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"; // Manage
import MaterialIcons from "@expo/vector-icons/MaterialIcons"; // Profile

// Image picker
import * as ImagePicker from "expo-image-picker";

// Navigation defined
export default Create = ({ navigation }) => {
  // Bottom tab navigator for admin navigation
  const BottomTabNav = createBottomTabNavigator();

  return (
    // Tab Navigator for the admin's screens
    <BottomTabNav.Navigator
      screenOptions={() => ({
        headerShown: false, // Hide header ("Create")
        tabBarStyle: {
          backgroundColor: "rgba(34,36,40,1)", // Grey background of the tabNavigator
          borderTopWidth: 0, // Removes the little white line above the tabs
        },
        tabBarActiveTintColor: "rgb(0,225,130)", // Turqoise green for the Active Tab
        tabBarInactiveTintColor: "grey",
      })}
    >
      <BottomTabNav.Screen
        name="Create"
        component={CreateScreen}
        options={() => ({
          tabBarIcon: ({ focused }) => (
            <AntDesign
              name="pluscircleo"
              size={24}
              color={focused ? "rgb(0,225,130)" : "grey"}
            /> // Changes icon's colour, turquoise green if active, grey if not.
          ),
        })}
      />
      <BottomTabNav.Screen
        name="Manage"
        component={ManageScreen}
        options={() => ({
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="clipboard-edit-outline"
              size={24}
              color={focused ? "rgb(0,225,130)" : "grey"}
            />
          ),
        })}
      />
      <BottomTabNav.Screen
        name="Profile"
        component={ProfileScreen}
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

function CreateScreen() {
  // Event handlers for input fields
  const [name, setName] = React.useState();
  const [address, setAddress] = React.useState();
  const [totalPlayers, setTotalPlayers] = React.useState();
  // const [pricePerPlayer, setPricePerPlayer] = React.useState();
  const [description, setDescription] = React.useState();

  // Date Time picker =============
  const [date, setDate] = React.useState(new Date(1732125600000)); // Number sets default time, the epoch time (seconds since 1/1/1970)
  const [mode, setMode] = React.useState("date");
  const [show, setShow] = React.useState(false);

  // Image picker =================
  const [image, setImage] = React.useState(true);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate;
    setShow(false);
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const showTimepicker = () => {
    showMode("time");
  };

  // ==============================

  const clear = () => {
    // Reset all input fields to initial states (blank/default value)
    setName("");
    setAddress("");
    setDate(new Date(1732125600000)); // reset to 20/11/24 18:00:00
    // setPricePerPlayer("");
    setTotalPlayers("");
    setDescription("");
    setImage(null);
  };

  const upload = async () => {
    // Validate all input fields.
    if (name.length > 0 && address.length > 0 && totalPlayers.length > 0) {
      // Key fields have been entered.
      // Upload data to Firestore, creating a new Document in the matches collection.
      try {
        // For customID, / messes up the logic (as then thinks the date is the data)
        // To prevent this, replace / with . and that should fix it.
        // Format: DateTime.Name.Capacity. (So organises itself chronologically in the Firestore)
        var customID = date
          .toLocaleString()
          .concat(".", name, ".", totalPlayers, "players")
          .replaceAll("/", ".")
          .replaceAll(" ", "");

        // An array is also made to store the booked users
        const bookedUsers = new Array();

        // Logic to write to the Firestore database
        const docRef = await setDoc(doc(db, "matches", customID), {
          Name: name,
          Location: address,
          DateAndTime: date.toLocaleString(),
          MaxPlayers: totalPlayers,
          PricePerPlayer: 5,
          Description: description,
          BookedUsers: bookedUsers,
          Active: true, // Default set to active as just uploaded
        });

        // Upload the image
        const uploadResp = await uploadToFirebase(
          image.toLocaleString(),
          customID,
          (v) => console.log(v)
        );
      } catch (error) {
        console.error("Error adding document: ", error);
      }

      Alert.alert("Match Uploaded!", "You successfully uploaded that match.", {
        text: "OK",
      });
      clear();
    }
  };

  const uploadToFirebase = async (uri, name, onProgress) => {
    // Helpful function from a tutorial for uploading images
    const fetchResponse = await fetch(uri);
    const theBlob = await fetchResponse.blob();

    const imageRef = ref(getStorage(), `images/${name}`);

    const uploadTask = uploadBytesResumable(imageRef, theBlob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress && onProgress(progress);
        },
        (error) => {
          // Handle unsuccessful uploads
          console.log(error);
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            metadata: uploadTask.snapshot.metadata,
          });
        }
      );
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hello ADMIN!</Text>
        <Text style={styles.subtitle}>
          Create a new game for users to join.
        </Text>
        {/* Scrollview, input fields + labels, two buttons- reset + upload- add event listeners to handle variables and ensure 
        ensure all reasonable inputs before uploading to database. E.G. Description = 100 chars. */}
      </View>
      <ScrollView style={styles.scrollable}>
        {/* Location section */}
        <Text style={styles.scrollTitle}>Location:</Text>

        <Text style={styles.scrollLabel}>Name:</Text>
        <TextInput
          style={styles.textInput}
          onChangeText={setName}
          value={name}
          placeholder="Paste in the name of the venue."
        />

        <Text style={styles.scrollLabel}>Address:</Text>
        <TextInput
          // GEOPOINT FIELD! TO ADD ADDRESS- Later, for now just copy in address.
          style={styles.textInput}
          onChangeText={setAddress}
          value={address}
          placeholder="Paste in the address of the venue."
        />

        {/* Match section */}
        <Text style={styles.scrollTitle}>Match:</Text>

        <Text style={styles.scrollLabel}>Date & Time:</Text>
        <Button onPress={showDatepicker} title="Show date picker!" />
        <Button onPress={showTimepicker} title="Show time picker!" />
        <Text
          style={{
            textAlign: "center",
            margin: "5%",
            textDecorationLine: "underline",
          }}
        >
          Chosen Date and Time:
        </Text>
        <Text style={{ textAlign: "center", fontWeight: "800" }}>
          {date.toLocaleString()}
        </Text>
        {show && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode={mode}
            is24Hour={true}
            onChange={onChange}
            style={{ marginTop: "7%", alignSelf: "center" }}
          />
        )}

        <Text style={styles.scrollLabel}>Total players:</Text>
        <TextInput
          // Drop down menu for numbers, or input field for number of players
          style={styles.textInput}
          onChangeText={setTotalPlayers}
          value={totalPlayers}
          placeholder="Enter the number of players."
          keyboardType="number-pad"
        />

        {/* <Text style={styles.scrollLabel}>Price per Player:</Text>
        <TextInput
          // Drop down menu for numbers, or input field for price
          style={styles.textInput}
          onChangeText={setPricePerPlayer}
          value={pricePerPlayer}
          placeholder="Enter the price per player (£ xx.yy)."
          keyboardType="decimal-pad" // So can add point for prices
        /> */}

        <Text style={styles.scrollLabel}>Description:</Text>
        <TextInput
          style={styles.textInput}
          onChangeText={setDescription}
          value={description}
          placeholder="Paste in any extra info, e.g. directions."
        />

        {/* Image uploader */}
        <Button title="Pick an image from camera roll" onPress={pickImage} />
        {image && <Image source={{ uri: image }} style={styles.image} />}

        {/* Buttons- Clear/Reset and Upload */}
        <TouchableOpacity style={styles.clear} onPress={() => clear()}>
          <Text style={styles.buttonText}>Clear screen.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.upload} onPress={() => upload()}>
          <Text style={styles.buttonText}>
            Upload match. <Image source={GreenArrow} style={styles.gArrow} />
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
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
    height: "20%", // Needs checked and clarified.
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

  scrollable: {
    width: "117%",
    backgroundColor: "#a4a3a3", // Light gray
  },

  scrollTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "blue",
    paddingLeft: "7%",
    textDecorationLine: "underline",
    marginTop: "7%",
  },

  scrollLabel: {
    fontSize: 18,
    fontWeight: "400",
    color: "green",
    paddingLeft: "7%",
    marginTop: "7%",
  },

  textInput: {
    height: 40,
    margin: "7%",
    borderWidth: 1,
    padding: "7%",
    backgroundColor: "white",
  },

  // Buttons
  clear: {
    alignSelf: "center",
    marginTop: "7%",
    width: "86%", // so 7% margin either side, lining up with above components
    padding: "5%",
    backgroundColor: "rgb(225, 0, 95)", // complimentary pinky red
    borderRadius: "100%",
  },

  upload: {
    alignSelf: "center",
    marginTop: "7%",
    marginBottom: "7%",
    width: "86%",
    padding: "5%",
    backgroundColor: "rgb(0,225,130)", // turqoise green
    borderRadius: "100%",
  },

  buttonText: {
    fontSize: 24,
    textAlign: "center",
    fontWeight: "700",
    color: "white",
  },

  gArrow: {
    width: 24,
    height: 24,
    backgroundColor: "white",
    borderRadius: "100%",
  },

  image: {
    // For selected image
    width: 200,
    height: 200,
    alignSelf: "center",
  },
});
