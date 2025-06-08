import "dotenv/config";

let appName = "(default)ケイドロ";
if (process.env.EAS_BUILD_PROFILE === "development") {
  appName = "(開発)ケイドロ";
} else if (process.env.EAS_BUILD_PROFILE === "preview") {
  appName = "(検証)ケイドロ";
} else if (process.env.EAS_BUILD_PROFILE === "production") {
  appName = "ケイドロ";
}

export default {
  expo: {
    name: appName,
    slug: "DeviceFieldPlay",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    extra: {
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: process.env.AWS_REGION,
      eas: {
        projectId: process.env.PROJECT_ID,
      },
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.aonot.devicefield",
    },
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.aonot.devicefield",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: "カメラの権限を許可してください",
        },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "位置情報の取得を許可してください",
        },
      ],
      [
        "expo-notifications",
        {
          color: "#ffffff",
          defaultChannel: "default",
          enableBackgroundRemoteNotifications: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
