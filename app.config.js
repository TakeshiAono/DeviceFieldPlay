import "dotenv/config";

let appName = "(開発)ケイドロ";
if (process.env.EAS_BUILD_PROFILE === "preview") {
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
      scheme: "keidoro",
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
    infoPlist: {
      NSCameraUsageDescription:
        "ゲーム内で他プレイヤーのQRコードを読み取るためにカメラを使用します。",
      NSLocationWhenInUseUsageDescription:
        "現在地を取得してプレイヤー同士の位置関係を表示するために位置情報を使用します。",
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
          cameraPermission:
            "ゲーム内でQRコードを読み取るためにカメラを使用します。",
        },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "現在地を取得してプレイヤー同士の位置関係を表示するために位置情報を使用します。",
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
