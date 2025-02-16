import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from '@rneui/themed';
import { useState, useEffect, useRef } from "react";
import QRCode from "react-native-qrcode-svg";

import * as Location from "expo-location";
import MapView, {
  LatLng,
  Marker,
  Polyline,
  Region,
} from "react-native-maps";
import { dynamoTagGamesPut } from "@/utils/APIs";
import { IconSymbol } from "@/components/ui/IconSymbol";
import ReactNativeModal from "react-native-modal";

export type Marker = LatLng & { key: number }

const initialJapanRegion = {
  latitude: 36.2048,
  longitude: 138.2529,
  latitudeDelta: 0.001,
  longitudeDelta: 0.001,
};

export default function MapScreen() {
  const [region, setRegion] = useState<Region>(initialJapanRegion);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [gameId, setGameId] = useState("");
  const [qrVisible, setQrVisible] = useState(false);
  const [isFirstUpdate, setIsFirstUpdate] = useState(true); // ✅ 初回更新フラグ

  const i = useRef(1);

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
      {/* TODO: 設定画面ができた時に移動させる */}
      <ReactNativeModal style={{margin: "auto"}} isVisible={qrVisible}>
        <View style={{backgroundColor: "white", width: 330, padding: 20}}>
          {gameId ? 
            <>
              <Text style={{fontSize: 30}}>参加QR</Text>
              <Text>{"友達にスキャンしてもらい\nゲームに参加してもらいましょう"}</Text>
              <View style={{alignItems: "center", marginVertical: 20}}>
                <QRCode size={150} value={gameId} />
              </View>
            </>
            : <></>}
          <Button type="solid" color={"red"} onPress={() => {setQrVisible(false)}}>
            閉じる
          </Button>
        </View>
      </ReactNativeModal>
      {/* TODO: 設定画面ができた時に移動させる */}
      <View style={{position: "absolute", top: 100, right: 5, zIndex: 1}}>
        <View style={{display: "flex", gap: 5}}>
          <Button type="solid" onPress={async () => {
            const gameId = await dynamoTagGamesPut(markers)
            setGameId(gameId)
          }}>
            <IconSymbol size={28} name={"save.fill"} color={"white"} />
          </Button>
          <Button type="solid" onPress={resetMarkers}>
            <IconSymbol size={28} name={"reset"} color={"white"} />
          </Button>
          <Button type="solid" onPress={() => {setQrVisible(true)}}>
            <IconSymbol size={28} name={"qr"} color={"white"} />
          </Button>
        </View>
      </View>
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
