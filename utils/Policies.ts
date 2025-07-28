import { requestForegroundPermissionsAsync } from "expo-location";
import {
  AndroidImportance,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from "expo-notifications";

export async function getLocationPermissionStatus() {
  const { status } = await requestForegroundPermissionsAsync();

  return status;
}

export async function registerForPushNotificationsAsync() {
  const { status } = await requestPermissionsAsync();
  if (status !== "granted") {
    return;
  }

  await setNotificationChannelAsync("default", {
    name: "default",
    importance: AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });
}
