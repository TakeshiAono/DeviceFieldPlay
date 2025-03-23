import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { useCameraPermissions } from "expo-camera";
import * as Notifications from "expo-notifications";

import Map from "@/components/Map";
import UserStore from "@/stores/UserStore";
import { inject, observer } from "mobx-react";

interface Props {
  _userStore?: UserStore;
}

function MapScreen({ _userStore }: Props) {
  const userStore = _userStore!;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermissionStatus, setLocationPermissionStatus] = useState("");

  const deviceId = useRef("");

  Notifications.getDevicePushTokenAsync().then(({ data }) => {
    console.log("deviceId:", data);
    deviceId.current = data;
    userStore.getCurrentUser().setDeviceId(data);
  });

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

export default inject("_userStore")(observer(MapScreen));
