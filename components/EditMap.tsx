import { StyleSheet } from "react-native";
import React, { useState } from "react";
import MapView, { LatLng, Marker, Polygon, Region } from "react-native-maps";
import "react-native-get-random-values";
import { inject, observer } from "mobx-react";

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
            <>
              {points.map((point, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: point.latitude,
                    longitude: point.longitude,
                  }}
                />
              ))}
              <Polygon
                fillColor={drawColor}
                coordinates={points} // 東京
              />
            </>
          )}
        </MapView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    flex: 1,
  },
});

export default inject("_userStore", "_tagGameStore")(observer(EditMap));
