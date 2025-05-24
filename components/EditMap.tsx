import { Alert, StyleSheet } from "react-native";
import React, { useState } from "react";
import MapView, { LatLng, Polygon, Region } from "react-native-maps";
import { booleanPointInPolygon, point, polygon } from "@turf/turf";
import "react-native-get-random-values";
import { inject, observer } from "mobx-react";

import { rejectUser } from "@/utils/APIs";
import UserStore from "@/stores/UserStore";
import TagGameStore from "@/stores/TagGameStore";

export type Props = {
  mapVisible?: boolean;
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
  drawColor: string;
  points: LatLng[];
  setPoints: (points: LatLng[]) => void;
};

export const initialJapanRegion = {
  latitude: 36.2048,
  longitude: 138.2529,
  latitudeDelta: 0.001,
  longitudeDelta: 0.001,
};

type latitude = number;
type longitude = number;

function EditMap({
  mapVisible = true,
  _userStore,
  _tagGameStore,
  setPoints,
  points,
  drawColor,
}: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  const [region, setRegion] = useState<Region>(initialJapanRegion);

  const [isFirstUpdate, setIsFirstUpdate] = useState(true);
  const [isCurrentUserLive, setIsCurrentUserLive] = useState(true);

  const onChangeCurrentPosition = async (position: [longitude, latitude]) => {
    if (
      points.length === 0 ||
      !tagGameStore.getTagGame().getIsSetValidAreaDone()
    )
      return;

    const targetPolygon = points.map((point) => [
      point.longitude,
      point.latitude,
    ]);
    const targetPoint = point(position);

    // TODO: areaを毎回計算するのはパフォーマンス効率が悪いため、エリア変更時にuseRefで保存するように変更する
    const area = polygon([targetPolygon]);
    const isInside: boolean = booleanPointInPolygon(targetPoint, area);

    if (!userStore.getCurrentUser().getDeviceId()) return;

    if (!isInside) {
      if (isCurrentUserLive === false) return;

      await rejectUser(
        tagGameStore.getTagGame().getId(),
        userStore.getCurrentUser().getDeviceId(),
      );
      setIsCurrentUserLive(false);
      Alert.alert("脱落通知", "エリア外に出たため脱落となりました。", [
        { text: "OK" },
      ]);
    }
  };

  const isGameMaster = () => {
    return userStore.isCurrentUserGameMaster(tagGameStore.getTagGame());
  };

  return (
    <>
      {mapVisible && (
        <MapView
          style={styles.map}
          showsUserLocation={true}
          followsUserLocation={true}
          showsMyLocationButton={true}
          region={region}
          onPress={(event) => {
            if (
              !(isGameMaster() || !tagGameStore.getTagGame().isSetGame()) ||
              !setPoints
            )
              return;

            setPoints([
              ...points,
              {
                ...event.nativeEvent.coordinate,
              },
            ]);
          }}
          onUserLocationChange={(event) => {
            if (!event.nativeEvent.coordinate) return;
            const currentPosition: [number, number] = [
              event.nativeEvent.coordinate.longitude,
              event.nativeEvent.coordinate.latitude,
            ];
            onChangeCurrentPosition(currentPosition);

            // NOTE: 初期マップ表示の時にだけ発火し、現在位置の表示範囲に書き換える
            if (!isFirstUpdate) return;
            event.persist();
            setRegion({
              latitude:
                event.nativeEvent.coordinate?.latitude ??
                initialJapanRegion.latitude,
              longitude:
                event.nativeEvent.coordinate?.longitude ??
                initialJapanRegion.longitude,
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            });
            setIsFirstUpdate(false);
          }}
          onRegionChange={(_, details) => {
            if (details.isGesture) {
              setRegion((prev) => {
                return {
                  latitude: prev.latitude,
                  longitude: prev.longitude,
                  latitudeDelta: prev.latitudeDelta,
                  longitudeDelta: prev.longitudeDelta,
                };
              });
            }
          }}
        >
          {points.length > 0 && (
            <Polygon
              fillColor={drawColor}
              coordinates={points} // 東京
            />
          )}
        </MapView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});

export default inject("_userStore", "_tagGameStore")(observer(EditMap));
