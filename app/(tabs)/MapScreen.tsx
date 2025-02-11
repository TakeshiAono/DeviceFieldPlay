import { StyleSheet, Image, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useState, useEffect, useMemo } from 'react';

import * as Location from 'expo-location';
import MapView, { Region } from 'react-native-maps';

export default function MapScreen() {
  const [region, setRegion] = useState<Region>({
    latitude: 36.2048,
    longitude: 138.2529,
    latitudeDelta: 0.001,
    longitudeDelta: 0.001,
  })
  const [isFirstUpdate, setIsFirstUpdate] = useState(true); // ✅ 初回更新フラグ

  useEffect(() => {
    async function confirmPermission() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
    }

    confirmPermission();
  }, []);

  return (
    <SafeAreaView>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
        region={region}
        onUserLocationChange={(event) => {
          // NOTE: 初期マップ表示の時にだけ発火し、現在位置の表示範囲に書き換える
          if (!isFirstUpdate || !event.nativeEvent.coordinate) return;

          event.persist()
          setRegion({
              latitude: event.nativeEvent.coordinate?.latitude ?? 36.2048,
              longitude: event.nativeEvent.coordinate?.longitude ?? 138.2529,
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            }
          );
          setIsFirstUpdate(false)
        }}
        onRegionChange={(_, details) => {
          if (details.isGesture) {
            setRegion((prev) => {
              return {
                latitude: prev.latitude,
                longitude: prev.longitude,
                latitudeDelta: prev.latitudeDelta,
                longitudeDelta: prev.longitudeDelta,
              }
            })
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});
