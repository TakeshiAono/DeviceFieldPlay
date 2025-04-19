import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { useCameraPermissions } from "expo-camera";
import * as Notifications from "expo-notifications";

import UserStore from "@/stores/UserStore";
import { inject, observer } from "mobx-react";
import TagGameStore from "@/stores/TagGameStore";
import ShowMap from "@/components/ShowMap";
import { MapAreaColors } from "@/constants/Colors";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function MapScreen({ _userStore, _tagGameStore }: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

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

  return (
    <SafeAreaView>
      <ShowMap
        validPoints={tagGameStore.getTagGame().getValidAreas()}
        validPointsDrawColor={MapAreaColors.validArea}
        prisonPoints={tagGameStore.getTagGame().getPrisonArea()}
        prisonPointsDrawColor={MapAreaColors.prisonArea}
      />
    </SafeAreaView>
  );
}

export default inject("_userStore", "_tagGameStore")(observer(MapScreen));
