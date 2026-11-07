import { StatusBar } from "expo-status-bar";
import { View, Text, ScrollView, StyleSheet } from "react-native";

// For useState for button handling
import React from "react";

export default function TermsAndConditionsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Screen Title */}
      <Text style={styles.headingText}>Terms and Conditions:</Text>

      {/* T&C's */}
      <ScrollView>
        <Text style={styles.bodyText}>
          Effective Date: Sunday 3rd November 2024.
        </Text>
        <Text style={styles.bodyText}>
          Welcome to KickOffNI! By accessing or using our mobile application
          (the “App”), you agree to these Terms and Conditions (“Terms”) set
          forth below. Please read them carefully.
        </Text>
        <Text style={styles.bodyText}>1. About KickOffNI </Text>
        <Text style={styles.bodyText}>
          KickOffNI (“we,” “us,” “our”) is an app that connects users interested
          in joining public 5-a-side football games throughout Northern Ireland.
          Our aim is to increase access to games and foster a football
          community, regardless of whether you know the players previously or if
          they are complete strangers!
        </Text>
        <Text style={styles.bodyText}>2. Age Requirement </Text>
        <Text style={styles.bodyText}>
          You must be at least 18 years old to use the App. By creating an
          account, you confirm that you meet this age requirement. We reserve
          the right to take necessary measures to verify users’ ages and remove
          those under 18.
        </Text>
        <Text style={styles.bodyText}>3. User Conduct and Safety</Text>
        <Text style={styles.bodyText}>a. Assumption of Risk </Text>
        <Text style={styles.bodyText}>
          Football is a physical sport that carries inherent risks. By using
          KickOffNI, you acknowledge and accept that participation in any match
          arranged through the App is at your own risk, and we shall not be held
          liable for any injuries, damages, or other harm suffered while
          participating.
        </Text>
        <Text style={styles.bodyText}>b. User Responsibility </Text>
        <Text style={styles.bodyText}>
          Users agree to behave respectfully and responsibly during games and to
          adhere to any rules communicated by game organizers. Violent,
          aggressive, or inappropriate behaviour may result in removal from the
          platform without prior warning.
        </Text>
        <Text style={styles.bodyText}>4. Payment and Refunds </Text>
        <Text style={styles.bodyText}>
          Payments for participation in games are processed through a
          third-party provider, Stripe, and are subject to their Terms of
          Service. Refunds are only available if a match is cancelled; no other
          refunds will be issued. KickOffNI is not responsible for handling
          payments directly and is not liable for any issues arising from
          Stripe’s service.
        </Text>
        <Text style={styles.bodyText}>5. Data Collection and Privacy </Text>
        <Text style={styles.bodyText}>
          We collect necessary personal data to improve your experience and
          enable participation in games. This includes, but is not limited to,
          name, email address, age, and location. All data is securely stored in
          our Firebase database and can be deleted upon user request. Our data
          handling complies with UK data protection laws. For more details,
          refer to our Privacy Policy.
        </Text>
        <Text style={styles.bodyText}>6. Account Termination </Text>
        <Text style={styles.bodyText}>
          We reserve the right to suspend or terminate accounts if users violate
          these Terms, engage in inappropriate behaviour, or if there are other
          security concerns. Users may delete their account at any time by
          contacting us at kickoffnihelp@gmail.com.
        </Text>
        <Text style={styles.bodyText}>7. Intellectual Property </Text>
        <Text style={styles.bodyText}>
          All content on the App, including logos, designs, and text, is the
          property of KickOffNI or its licensors. Users agree not to reproduce,
          distribute, or use our content for commercial purposes without our
          written consent.
        </Text>
        <Text style={styles.bodyText}>8. Limitation of Liability </Text>
        <Text style={styles.bodyText}>
          To the fullest extent permitted by law, KickOffNI and its affiliates,
          officers, employees, agents, or partners will not be liable for any
          direct, indirect, incidental, or consequential damages arising out of
          your use of the App or participation in games, even if advised of the
          possibility of such damages.
        </Text>
        <Text style={styles.bodyText}>9. Amendments </Text>
        <Text style={styles.bodyText}>
          KickOffNI reserves the right to modify these Terms at any time. We
          will notify users of any significant changes within the App, and
          continued use of the App after such changes constitutes acceptance of
          the updated Terms.
        </Text>
        <Text style={styles.bodyText}>
          10. Governing Law and Dispute Resolution{" "}
        </Text>
        <Text style={styles.bodyText}>
          These Terms are governed by the laws of Northern Ireland. Any disputes
          arising from these Terms or the use of the App shall be resolved
          exclusively in the courts of Northern Ireland.
        </Text>
        <Text style={styles.bodyText}>11. Contact Us </Text>
        <Text style={styles.bodyText}>
          If you have any questions or concerns about these Terms or your use of
          the App, please contact us at kickoffnihelp@gmail.com.
        </Text>
        <Text style={styles.bodyText}>
          By using KickOffNI, you confirm that you have read, understood, and
          agreed to abide by these Terms and Conditions.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%", // Copied from Welcome screen for responsive layout
    height: "100%",
    padding: "7%", // Space that is not the screen- blank space for ease of layouts
    alignItems: "center", // Horizontally centers all content
    backgroundColor: "rgb(35, 31, 32)", // Charcoal grey
  },

  // Headline text
  headingText: {
    fontSize: 26,
    fontWeight: "700",
    color: "rgb(0,225,130)", // turqoise green
    textAlign: "center",
    marginTop: "5%",
  },

  // Body text
  bodyText: {
    fontSize: 16,
    fontWeight: "400",
    color: "white",
    marginTop: "5%",
  },
});
