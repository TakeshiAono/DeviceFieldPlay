import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useCameraPermissions } from "expo-camera";
import { getCurrentPositionAsync } from "expo-location";

import UserStore from "@/stores/UserStore";
import { inject, observer } from "mobx-react";
import TagGameStore from "@/stores/TagGameStore";
import ShowMap from "@/components/ShowMap";
import { MapAreaColors } from "@/constants/Colors";
import { getLocationPermissionStatus } from "@/utils/Policies";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function MapScreen({ _tagGameStore }: Props) {
  const tagGameStore = _tagGameStore!;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermissionStatus, setLocationPermissionStatus] = useState("");

  useEffect(() => {
    getLocationPermissionStatus().then(async (status) => {
      setLocationPermissionStatus(status);
    });
  }, []);

  useEffect(() => {
    if (locationPermissionStatus === "granted") {
      getCurrentPositionAsync({});
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
