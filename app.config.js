import "dotenv/config";

let appName = "(開発)ケイドロ";
if (process.env.EAS_BUILD_PROFILE === "preview") {
  appName = "(検証)ケイドロ";
} else if (process.env.EAS_BUILD_PROFILE === "production") {
  appName = "ケイドロ";
}

// 開発のためのデバイスがAndroid15以上にアップデートできないため、本番環境以外は特に下限バージョンを指定しない
const buildPropertiesPlugin =
  process.env.EAS_BUILD_PROFILE === "production"
    ? [
        "expo-build-properties",
        {
          android: {
            // Android 16 (API Level 36) までの機能を使用できるようにビルドする設定（上限）
            compileSdkVersion: 36,
            // Android 16 (API Level 36) を対象として最適化する設定（ターゲット）
            // 最適ではないAndroidバージョンだと若干パフォーマンスの低下や新機能を使用できない場合がある
            targetSdkVersion: 36,
            // Android 15 (API Level 35) 以降の端末で動作可能にする設定（下限）
            minSdkVersion: 35,
          },
        },
      ]
    : null;

export default {
  expo: {
    name: appName,
    slug: "DeviceFieldPlay",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "keidoro",
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
      supportsTablet: false,
      bundleIdentifier: "com.aonot.devicefield",
      infoPlist: {
        NSCameraUsageDescription:
          "ゲーム内で他プレイヤーのQRコードを読み取るためにカメラを使用します。",
        NSLocationWhenInUseUsageDescription:
          "現在地を取得してプレイヤー同士の位置関係を表示するために位置情報を使用します。",
        UIDeviceFamily: [1],
      },
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
      ...(buildPropertiesPlugin ? [buildPropertiesPlugin] : []),
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
