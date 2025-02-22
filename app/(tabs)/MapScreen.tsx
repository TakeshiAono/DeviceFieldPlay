import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { useCameraPermissions } from "expo-camera";

import Map from "@/components/Map";

export default function MapScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermissionStatus, setLocationPermissionStatus] = useState("");

  useEffect(() => {
    async function getCurrentLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status;
    }

    getCurrentLocation().then(async (status) => {
      setLocationPermissionStatus(status);
    });
  }, []);

  useEffect(() => {
    if (locationPermissionStatus === "granted") {
      Location.getCurrentPositionAsync({});
    }
  }, [locationPermissionStatus]);

  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted) {
      requestCameraPermission();
    }
  }, [cameraPermission]);

  const isDisplayMap = () => {
    return locationPermissionStatus == "granted";
  };

  return (
    <SafeAreaView>
      {/* TODO: 設定画面ができた時に設定画面にマップを出力させたい */}
      <Map mapVisible={isDisplayMap()} />
    </SafeAreaView>
  );
}
