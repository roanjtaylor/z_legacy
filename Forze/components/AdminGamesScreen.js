import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";

// For Firebase access
import { auth } from "../firebaseConfig"; // Correct import of auth from firebaseConfig
import { firestore, storage } from "../firebaseConfig"; // Ensure firestore is exported from firebaseConfig
import { doc, setDoc } from "firebase/firestore"; // Firestore methods
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // For images

// For Image selector
import * as ImagePicker from "expo-image-picker";

// For Pickers (Type, Gender, Date/Time)
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

// For Map view of the match
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

export default function AdminView({ user, reloadUser }) {
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    dateTime: new Date(2025, 0, 1, 0, 0), // Default to 1 Jan 2025, 00:00
    location: "",
    venuePrice: "",
    pricePerPlayer: "",
    gender: "",
    description: "",
    image: null,
    live: true,
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false); // For toggling picker visibility
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false); // For toggling date-time picker visibility
  const [mapRegion, setMapRegion] = useState(null); // State for map region

  // Handle input changes
  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  // Handle image selection
  const handleSelectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;
        console.log("Image selected:", selectedImage);
        setFormData({ ...formData, image: selectedImage });
      } else {
        console.log("Image selection canceled or invalid result.");
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async (uri) => {
    try {
      if (!uri) {
        throw new Error("No image URI provided");
      }

      const response = await fetch(uri);
      const blob = await response.blob();

      // Format the dateTime to 'YYYY-MM-DD-HH-MM'
      const date = formData.dateTime
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-"); // Format date as DD-MM-YYYY
      const time = formData.dateTime
        .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        .replace(":", "-"); // Format time as HH-MM

      // Combine date and time with the name for a unique image name
      const imageName = `${date}-${time}-${formData.name.replace(
        /\s+/g,
        "-"
      )}.jpg`;

      const storageRef = ref(storage, `Images/${imageName}`);

      // Upload the image
      const uploadResult = await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      console.log("Image uploaded successfully:", downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error("Error uploading image:", error.message);
      Alert.alert("Error", "Failed to upload image. Please try again.");
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.size ||
      !formData.dateTime ||
      !formData.location ||
      !formData.venuePrice ||
      !formData.pricePerPlayer ||
      !formData.gender ||
      !formData.description ||
      !formData.image ||
      formData.latitude === null ||
      formData.longitude === null
    ) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    setLoading(true);

    try {
      // Upload image and get URL
      const imageUrl = await uploadImage(formData.image);
      if (!imageUrl) {
        setLoading(false);
        return;
      }

      // Save match details to Firestore
      const uniqueID = formData.dateTime + "-" + formData.name;
      const matchDocRef = doc(firestore, "matches", uniqueID); // Use email as the document ID
      await setDoc(matchDocRef, {
        name: formData.name,
        size: parseFloat(formData.size),
        dateTime: formData.dateTime,
        location: formData.location,
        venuePrice: parseFloat(formData.venuePrice),
        pricePerPlayer: parseFloat(formData.pricePerPlayer),
        gender: formData.gender,
        description: formData.description,
        imageUrl: imageUrl,
        latitude: formData.latitude,
        longitude: formData.longitude,
        live: formData.live,
        createdBy: user?.id,
        createdAt: new Date(),
        users: [],
      });

      Alert.alert("Success", "Match uploaded successfully!");
      setFormData({
        name: "",
        size: "",
        dateTime: new Date(2025, 0, 1, 0, 0),
        location: "",
        venuePrice: "",
        pricePerPlayer: "",
        gender: "",
        description: "",
        image: null,
        live: true,
        latitude: null,
        longitude: null,
      });
    } catch (error) {
      console.error("Error uploading match:", error);
      Alert.alert("Error", "Failed to upload match.");
    } finally {
      setLoading(false);
    }
  };

  // Handle date-time picker change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.dateTime;
    setShowDatePicker(false);
    setFormData({ ...formData, dateTime: currentDate });
  };

  // Handle address input and geocoding
  const handleLocationChange = async (text) => {
    setFormData({ ...formData, location: text });

    if (text.includes(".")) {
      try {
        const geocodeResult = await Location.geocodeAsync(text);
        if (geocodeResult && geocodeResult.length > 0) {
          const { latitude, longitude } = geocodeResult[0];
          setFormData({
            ...formData,
            latitude: latitude,
            longitude: longitude,
          });

          // Set initial map region when location changes
          setMapRegion({
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        } else {
          Alert.alert("Error", "Address not found.");
        }
      } catch (error) {
        console.error("Error geocoding location:", error);
        Alert.alert("Error", "Failed to geocode address.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside input
      >
        <Text style={styles.title}>Admin Upload Games</Text>
        <TextInput
          style={styles.input}
          placeholder="Match Name"
          value={formData.name}
          onChangeText={(text) => handleChange("name", text)}
        />

        {/* Team Size Display */}
        <Text style={styles.inputLabel}>Team Size</Text>
        <TouchableOpacity
          onPress={() => setShowPicker(!showPicker)}
          style={styles.pickerButton}
        >
          <Text style={styles.pickerText}>
            {formData.size ? `${formData.size} Players` : "Select Team Size"}
          </Text>
        </TouchableOpacity>

        {/* Conditional Picker Display */}
        {showPicker && (
          <Picker
            selectedValue={formData.size}
            style={styles.picker}
            onValueChange={(itemValue) => {
              handleChange("size", itemValue);
              setShowPicker(false); // Close the picker after selection
            }}
          >
            <Picker.Item label="Select Team Size" value="" />
            <Picker.Item label="5 Players" value="10" />
            <Picker.Item label="6 Players" value="12" />
            <Picker.Item label="7 Players" value="14" />
            <Picker.Item label="8 Players" value="16" />
            <Picker.Item label="9 Players" value="18" />
            <Picker.Item label="10 Players" value="20" />
            <Picker.Item label="11 Players" value="22" />
            <Picker.Item label="12 Players" value="24" />
            <Picker.Item label="13 Players" value="26" />
          </Picker>
        )}

        {/* Date and Time Picker */}
        <Text style={styles.inputLabel}>Date & Time</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(!showDatePicker)}
          style={styles.pickerButton}
        >
          <Text style={styles.pickerText}>
            {formData.dateTime
              ? formData.dateTime.toLocaleString("en-GB", {
                  weekday: "long", // Display full weekday name
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Select Date & Time"}
          </Text>
        </TouchableOpacity>

        {/* Conditional DateTime Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.dateTime}
            mode="datetime"
            is24Hour={true}
            onChange={onDateChange}
            minimumDate={new Date(2025, 0, 1)} // Disable dates before 1 Jan 2025
          />
        )}

        {/* Map view for location */}
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={formData.location}
          onChangeText={handleLocationChange}
        />

        {formData.latitude && formData.longitude && mapRegion && (
          <MapView
            style={styles.map}
            region={mapRegion} // Initially center the map on the pin
            onRegionChangeComplete={(region) => {
              // Optionally update form data or keep the new region if user moves the map
              setMapRegion(region); // Allow user to zoom and pan freely
            }}
          >
            <Marker
              coordinate={{
                latitude: formData.latitude,
                longitude: formData.longitude,
              }}
            />
          </MapView>
        )}

        {/* Price */}
        <TextInput
          style={styles.input}
          placeholder="Venue Price (£)"
          keyboardType="numeric"
          value={formData.venuePrice}
          onChangeText={(text) => handleChange("venuePrice", text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Price Per Player (£)"
          keyboardType="numeric"
          value={formData.pricePerPlayer}
          onChangeText={(text) => handleChange("pricePerPlayer", text)}
        />

        {/* Gender Display */}
        <Text style={styles.inputLabel}>Gender</Text>
        <TouchableOpacity
          onPress={() => setShowGenderPicker(!showGenderPicker)}
          style={styles.pickerButton}
        >
          <Text style={styles.pickerText}>
            {formData.gender
              ? formData.gender.charAt(0).toUpperCase() +
                formData.gender.slice(1)
              : "Select Gender"}
          </Text>
        </TouchableOpacity>

        {showGenderPicker && (
          <Picker
            selectedValue={formData.gender}
            style={styles.picker}
            onValueChange={(itemValue) => {
              handleChange("gender", itemValue);
              setShowGenderPicker(false); // Close the picker after selection
            }}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Mixed" value="Mixed" />
          </Picker>
        )}

        <TextInput
          style={styles.input}
          placeholder="Description"
          value={formData.description}
          onChangeText={(text) => handleChange("description", text)}
          multiline
        />

        {/* Image Picker */}
        <TouchableOpacity
          onPress={handleSelectImage}
          style={styles.imageButton}
        >
          <Text style={styles.imageButtonText}>
            {formData.image ? "Image Selected" : "Select Image"}
          </Text>
        </TouchableOpacity>

        {formData.image && (
          <Image
            source={{ uri: formData.image }}
            style={styles.selectedImage}
          />
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Uploading..." : "Upload Match"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    margin: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    alignSelf: "flex-start",
    marginLeft: 5,
  },
  pickerButton: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  pickerText: {
    fontSize: 16,
    color: "#000",
  },
  picker: {
    width: "100%",
    height: 200,
  },

  // Map view
  map: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },

  // Select image
  imageButton: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
  },
  imageButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 15,
    resizeMode: "cover",
  },

  // Submit button
  submitButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#28A745",
    borderRadius: 5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
  },
});
