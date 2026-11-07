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
} from "react-native";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../firebaseConfig"; // Ensure firestore is exported from firebaseConfig
import { useUser } from "../contexts/UserContext";
import MapView, { Marker } from "react-native-maps"; // Import MapView and Marker

export default function AdminView({ user, reloadUser }) {
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

  // Update live status to false
  const archiveMatch = async (matchId) => {
    try {
      const matchRef = doc(firestore, "matches", matchId);
      await updateDoc(matchRef, { live: false });

      // Remove the match from the local state
      setMatches((prevMatches) =>
        prevMatches.filter((match) => match.id !== matchId)
      );
    } catch (error) {
      console.error("Error updating match:", error);
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

  return (
    <ScrollView
      contentContainerStyle={styles.innerContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Admin Schedule</Text>

      {matches.map((match) => (
        <View key={match.id} style={styles.matchCard}>
          <Text style={styles.matchInfo}>{match.name}</Text>
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

          {/* View all details Button */}
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => openModal(match)}
          >
            <Text style={styles.viewDetailsButtonText}>View all details</Text>
          </TouchableOpacity>

          {/* Archive Match Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => archiveMatch(match.id)}
          >
            <Text style={styles.removeButtonText}>Archive Match</Text>
          </TouchableOpacity>
        </View>
      ))}

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
  removeButton: {
    backgroundColor: "#dc3545",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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

  map: {
    width: "100%",
    height: 200,
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: "#28a745",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
