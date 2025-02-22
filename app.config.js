import 'dotenv/config';

export default {
  "expo": {
    "name": "DeviceFieldPlay",
    "slug": "DeviceFieldPlay",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "extra": {
      "awsAccessKeyId": process.env.AWS_ACCESS_KEY_ID,
      "awsSecretAccessKey": process.env.AWS_SECRET_ACCESS_KEY,
      "awsRegion": process.env.AWS_REGION,
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "カメラの権限を許可してください"
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "位置情報の取得を許可してください",
        }
      ],
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
