import { StyleSheet, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useState, useEffect, useRef } from "react";

import * as Location from "expo-location";
import MapView, {
  LatLng,
  Marker,
  Polyline,
  Region,
} from "react-native-maps";

const initialJapanRegion = {
  latitude: 36.2048,
  longitude: 138.2529,
  latitudeDelta: 0.001,
  longitudeDelta: 0.001,
};

export default function MapScreen() {
  const [region, setRegion] = useState<Region>(initialJapanRegion);
  const [markers, setMarkers] = useState<(LatLng & { key: number })[]>([]);
  const i = useRef(1);
  const [isFirstUpdate, setIsFirstUpdate] = useState(true); // ✅ 初回更新フラグ

  useEffect(() => {
    async function confirmPermission() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
    }

    confirmPermission();
  }, []);

  const resetMarkers = () => {
    i.current = 1;
    setMarkers([]);
  };

  return (
    <SafeAreaView>
      <Button title={"リセット"} onPress={resetMarkers} />
      <MapView
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
        region={region}
        onLongPress={(event) => {
          setMarkers([
            ...markers,
            { ...event.nativeEvent.coordinate, key: i.current },
          ]);
          i.current += 1;
        }}
        onUserLocationChange={(event) => {
          // NOTE: 初期マップ表示の時にだけ発火し、現在位置の表示範囲に書き換える
          if (!isFirstUpdate || !event.nativeEvent.coordinate) return;

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
        {markers.map((marker) => (
          <Marker
            key={marker.key}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }} // 東京
            title={marker.key.toString()}
          />
        ))}
        <Polyline
          coordinates={markers}
          strokeWidth={5} // 線の太さ
          strokeColor="blue" // 線の色
        />
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});
