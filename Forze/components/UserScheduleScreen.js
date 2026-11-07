import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  Image,
  Alert,
} from "react-native";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { firestore } from "../firebaseConfig"; // Ensure firestore is exported from firebaseConfig
import MapView, { Marker } from "react-native-maps"; // Import MapView and Marker

export default function UserView({ user, reloadUser }) {
  const [matches, setMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Fetch live matches from Firestore
  const fetchMatches = async () => {
    try {
      const q = query(
        collection(firestore, "matches"),
        where("live", "==", true),
        where("users", "array-contains", user?.id),
        orderBy("dateTime")
      );
      const querySnapshot = await getDocs(q);
      const liveMatches = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMatches(liveMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatches(); // Fetch the latest data
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const openModal = (match) => {
    setSelectedMatch(match);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMatch(null);
  };

  const cancelBooking = () => {
    Alert.alert(
      "Success",
      "You successfully cancelled this booking. We do not offer refunds, but you're game credit is now on your account to use for a future game!"
    );
    setSelectedMatch(null);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.innerContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Booked Battles</Text>

      {/* Conditional rendering to show message if no matches */}
      {matches.length === 0 ? (
        <Text style={styles.noMatchesText}>
          You are currently not booked into any matches.
        </Text>
      ) : (
        matches.map((match) => (
          <View key={match.id} style={styles.matchCard}>
            <Text style={styles.matchInfo}>Booking: {match.name}</Text>
            <Text style={styles.matchDetails}>
              {match.dateTime.toDate().toLocaleString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            <Text style={styles.matchDetails}>
              Players: {match.users.length} / {match.size}
            </Text>
            <Text style={styles.matchDetails}>Location: {match.location}</Text>

            {/* Show the image if available */}
            {match.imageUrl ? (
              <Image
                source={{ uri: match.imageUrl }}
                style={styles.matchImage}
              />
            ) : (
              <Text style={styles.matchDetails}>No image available</Text>
            )}

            {/* View all details Button */}
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => openModal(match)}
            >
              <Text style={styles.viewDetailsButtonText}>View all details</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Modal to view all details */}
      {selectedMatch && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeModal}
        >
          <ScrollView style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Match Details</Text>
              <Text style={styles.modalDetails}>
                Name: {selectedMatch.name}
              </Text>
              <Text style={styles.modalDetails}>
                Date & Time:{" "}
                {selectedMatch.dateTime.toDate().toLocaleString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={styles.modalDetails}>
                Players: {selectedMatch.users.length} / {selectedMatch.size}
              </Text>
              <Text style={styles.modalDetails}>
                Location: {selectedMatch.location}
              </Text>

              {/* Show the image if available */}
              {selectedMatch.imageUrl ? (
                <Image
                  source={{ uri: selectedMatch.imageUrl }}
                  style={styles.matchImage}
                />
              ) : (
                <Text>No image available</Text>
              )}

              {/* Map displaying the match location */}
              {selectedMatch.location && (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: selectedMatch.latitude,
                    longitude: selectedMatch.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: selectedMatch.latitude,
                      longitude: selectedMatch.longitude,
                    }}
                    title={selectedMatch.name}
                    description={selectedMatch.location}
                  />
                </MapView>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelBooking}
              >
                <Text style={styles.closeButtonText}>Cancel booking</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    margin: 20,
  },
  matchCard: {
    width: "100%",
    backgroundColor: "#fff3d1",
    borderStyle: "solid",
    borderWidth: 0.3,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  matchInfo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  matchDetails: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 10,
  },
  viewDetailsButton: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  viewDetailsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginTop: 100,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalDetails: {
    fontSize: 16,
    marginBottom: 10,
  },
  matchImage: {
    width: 200,
    height: 200,
    marginBottom: 15,
    alignSelf: "center",
  },

  // Cancel and close buttons
  cancelButton: {
    backgroundColor: "#BB2D3B",
    borderRadius: 5,
    padding: 10,
    marginTop: 30,
    marginBottom: 30,
    alignItems: "center",
  },

  closeButton: {
    backgroundColor: "black",
    borderRadius: 5,
    padding: 10,
    marginTop: 30,
    marginBottom: 30,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noMatchesText: {
    fontSize: 18,
    color: "#888",
    marginTop: 20,
    fontStyle: "italic",
    textAlign: "center",
  },
  map: {
    width: "100%",
    height: 200,
    marginTop: 10,
  },
});
