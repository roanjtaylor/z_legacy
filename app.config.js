// import "dotenv/config";

export default {
  expo: {
    name: "KickOffNI",
    slug: "kickoffni",
    description: "This is Mk.3 of KickOffNI- the first public release!",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/loading/AppLogo.png",
    splash: {
      image: "./assets/loading/SplashLogo.png",
      resizeMode: "contain",
      backgroundColor: "#231F20",
    },
    ios: {
      supportsTablet: false, // Disallow IPads- only work on IPhones
      bundleIdentifier: "com.roanjtaylor.kickoffnimk3alpha1",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/loading/AppLogo.png",
        backgroundColor: "#ffffff",
      },
      package: "com.roanjtaylor.kickoffnimk3alpha1",
    },
    web: {
      favicon: "./assets/loading/favicon.png",
    },
    extra: {
      eas: {
        projectId: "2fe949a5-96fb-474d-b086-953641514419",
      },
      // Environment variables for sensitive info
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseDatabaseURL: process.env.FIREBASE_DATABASE_URL,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,

      publishableKey: process.env.PUBLISHABLE_KEY,
      secretKey: process.env.SECRET_KEY,

      serverURL: process.env.API_URL,
    },
    owner: "roanjtaylor",
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/2fe949a5-96fb-474d-b086-953641514419",
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app accesses your photos to let you share them with your friends.",
        },
      ],
      [
        "@stripe/stripe-react-native",
        {
          enableGooglePay: true,
        },
      ],
    ],
  },
};
