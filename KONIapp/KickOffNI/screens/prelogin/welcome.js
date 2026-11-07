import { StatusBar } from "expo-status-bar"; // Top of screen (Wifi, battery etc), configures it's appearance when app is open.
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";

// Imports for background video
import { Video } from "expo-av";
import BackgroundVideo from "../../assets/welcome/BackgroundVideo.mp4"; // ./ means same folder, ../ means up one rung in the folder hierarchy

// Import for linear gradient over the video
import { LinearGradient } from "expo-linear-gradient";

// KickOffNI logo for background
import KONILogo from "../../assets/welcome/TransparentLogo.png";

// Green Arrow for "Get Started" button
import GreenArrow from "../../assets/global/GreenArrow.png";

// Defines the appearance of the Welcome screen.
export default function WelcomeScreen({ navigation }) {
  // Event handlers for the Buttons
  const getStartedClicked = () => {
    navigation.push("Register");
  };

  const signInClicked = () => {
    navigation.push("Login");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Background video of people playing */}
      <Video
        source={BackgroundVideo}
        style={styles.backgroundVideo}
        rate={1}
        shouldPlay={true}
        isLooping={true}
        resizeMode="cover"
      />

      {/* Linear gradient for background faded colour */}
      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"]} // Grey - Clear- Grey
        locations={[0.1, 0.7, 0.9]} // locations for transition start between colours
        style={styles.gradient}
      />

      {/* KickOffNI logo */}
      <Image source={KONILogo} style={styles.logo} />

      {/* "Get Started" button */}
      <TouchableOpacity
        style={styles.gsOpacity}
        onPress={() => getStartedClicked()}
      >
        <Text style={styles.gsText}>
          Get Started <Image source={GreenArrow} style={styles.gArrow} />
        </Text>
      </TouchableOpacity>

      {/* "Sign In" button */}
      <TouchableOpacity
        style={styles.siOpacity}
        onPress={() => signInClicked()}
      >
        <Text style={styles.siText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    padding: "7%", // Space that is not the screen- blank space for ease of layouts
    alignItems: "center", // Horizontally centers all content
    backgroundColor: "white",
  },

  backgroundVideo: {
    height: "114%", // 100% + 2*7% = 114% to ensure video covers whole screen, including padding
    position: "absolute",
    alignItems: "stretch",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },

  gradient: {
    position: "absolute",
    top: 0, // Makes it fill the screen, not fully sure if padding/margin/other
    bottom: 0,
    left: 0,
    right: 0,
  },

  logo: {
    marginTop: "50%",
    width: "50%",
    height: "35%",
    resizeMode: "contain",
  },

  gsOpacity: {
    marginTop: "25%", // Layout gap below logo
    width: "100%", // 100% of the screen, excluding the padding
    padding: "5%", // Old value was ==4.375%, 5% looks good too and is round number
    backgroundColor: "rgb(0,225,130)", // Turqoise green
    borderRadius: "100%", // Seems to be responsive?
  },

  gsText: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "white",
  },

  gArrow: {
    width: 24,
    height: 24,
    backgroundColor: "white",
    borderRadius: "100%",
  },

  siOpacity: {
    marginTop: "7%", // Layout gap below getStarted button
    width: "100%", // 100% of the screen, excluding the padding
    padding: "5%",
    backgroundColor: "rgb(35, 31, 32)", // Charcoal grey

    // Green border around grey button
    borderRadius: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "rgb(0,225,130)", // Turqoise green
  },

  siText: {
    textAlign: "center",
    fontSize: 24,
    color: "rgb(0,225,130)", // Turqoise green
  },
});
