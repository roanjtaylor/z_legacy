import "dotenv/config";

export default {
  expo: {
    name: "KickOffNI",
    slug: "kickoffni",
    description: "This is Mk.3 of KickOffNI- the first public release!",
    version: "1.2.1",
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
      bundleIdentifier: "com.roanjtaylor.kickoffnimk3",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/loading/AppLogo.png",
        backgroundColor: "#ffffff",
      },
      package: "com.roanjtaylor.kickoffnimk3",
    },
    web: {
      favicon: "./assets/loading/favicon.png",
    },
    extra: {
      eas: {
        projectId: "d6f8530b-04b8-4398-ab15-ac419c846736",
      },
    },
    owner: "roanjtaylor",
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/d6f8530b-04b8-4398-ab15-ac419c846736",
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
      ["expo-secure-store"],
    ],
  },
};
