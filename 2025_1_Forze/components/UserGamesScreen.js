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
import { useUser } from "../contexts/UserContext";
import MapView, { Marker } from "react-native-maps"; // Import MapView and Marker
import { useStripe } from "@stripe/stripe-react-native"; // Stripe SDK

export default function UserView({ user, reloadUser }) {
  const [matches, setMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [paymentVisible, setPaymentVisible] = useState(false); // State for payment options
  const stripe = useStripe();

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
    setPaymentVisible(false); // Reset payment flow
  };

  const handlePayment = () => {
    // Simulate a successful payment
    Alert.alert("Success", "You have joined the game!");
    setPaymentVisible(false); // Hide payment options
    closeModal();
  };

  const showPaymentOptions = async () => {
    Alert.alert(
      "Payment Options",
      "Choose your payment method:",
      [
        { text: "Credit Card", onPress: () => mockPayment("Credit Card") },
        { text: "Apple Pay", onPress: () => mockPayment("Apple Pay") },
        { text: "Google Pay", onPress: () => mockPayment("Google Pay") },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const mockPayment = (method) => {
    Alert.alert(
      "Payment Simulated",
      `You have successfully simulated a payment via ${method}!`
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.innerContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Hello, {user?.forename}!</Text>

      {matches.map((match) => (
        <View key={match.id} style={styles.matchCard}>
          <Text style={styles.matchInfo}>
            {match.name}
            {match.users.includes(user.id) && (
              <Text style={{ color: "green", fontWeight: "bold" }}>
                {" "}
                BOOKED IN
              </Text>
            )}
          </Text>
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
            <Image source={{ uri: match.imageUrl }} style={styles.matchImage} />
          ) : (
            <Text>No image available</Text>
          )}

          {/* View all details Button */}
          {!match.users.includes(user.id) && (
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => openModal(match)}
            >
              <Text style={styles.viewDetailsButtonText}>View all details</Text>
            </TouchableOpacity>
          )}
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
                {selectedMatch.users.includes(user.id) && (
                  <Text style={{ color: "green", fontWeight: "bold" }}>
                    {" "}
                    BOOKED IN
                  </Text>
                )}
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

              {/* Join the Battle Button */}
              {/* JOIN IF SPOTS, WAITING LIST IF FULL */}
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => setPaymentVisible(true)}
              >
                <Text style={styles.joinButtonText}>Join the Battle</Text>
              </TouchableOpacity>

              {/* Payment Options */}
              {paymentVisible && (
                <View style={styles.paymentContainer}>
                  <Text style={styles.paymentText}>
                    Select a Payment Method:
                  </Text>
                  <TouchableOpacity
                    style={styles.paymentButton}
                    onPress={showPaymentOptions}
                  >
                    <Text style={styles.paymentButtonText}>Pay £5</Text>
                  </TouchableOpacity>
                </View>
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
  closeButton: {
    backgroundColor: "#BB2D3B",
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
  map: {
    width: "100%",
    height: 200,
    marginTop: 10,
  },

  // Payment styling
  joinButton: {
    backgroundColor: "#FFCD00",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  paymentContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  paymentText: {
    fontSize: 16,
    marginBottom: 10,
    textDecorationLine: "underline",
  },
  paymentButton: {
    backgroundColor: "#28a745",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
