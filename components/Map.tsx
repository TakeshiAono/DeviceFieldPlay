import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "@rneui/themed";
import { useState, useEffect, useRef } from "react";
import QRCode from "react-native-qrcode-svg";
import MapView, { LatLng, Marker, Polyline, Region } from "react-native-maps";
import ReactNativeModal from "react-native-modal";
import { CameraView } from "expo-camera";
import { booleanPointInPolygon, point, polygon } from "@turf/turf";

import { getTagGames, joinUser, patchDevices, putDevices, putTagGames, rejectUser, reviveUser } from "@/utils/APIs";
import { IconSymbol } from "@/components/ui/IconSymbol";

export type Marker = LatLng & { key: number };
export type Props = {
  mapVisible?: boolean;
  deviceId?: string;
};

const initialJapanRegion = {
  latitude: 36.2048,
  longitude: 138.2529,
  latitudeDelta: 0.001,
  longitudeDelta: 0.001,
};

type latitude = number
type longitude = number

export default function Map({ mapVisible = true, deviceId }: Props) {
  const [region, setRegion] = useState<Region>(initialJapanRegion);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [gameId, setGameId] = useState("");
  const [isSetDoneArea, setIsSetDoneArea] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [isFirstUpdate, setIsFirstUpdate] = useState(true);
  const [isCurrentLive, setIsCurrentLive] = useState(false);

  const pinCount = useRef(1);
  const firstScan = useRef(true);

  useEffect(() => {
    if (!gameId) return;

    getTagGames(gameId)
      .then((res) => {
        setMarkers(res?.areas);
        gameStart()
      })
      .catch((e) => console.error(e));
  }, [gameId]);

  const onChangeCurrentPosition = async (position: [longitude, latitude]) => {
    if (markers.length === 0 || !isSetDoneArea) return

    const targetPolygon = markers.map(marker => [marker.longitude, marker.latitude])
    const targetPoint = point(position)

    // TODO: areaを毎回計算するのはパフォーマンス効率が悪いため、エリア変更時にuseRefで保存するように変更する
    const area = polygon([targetPolygon]);
    const isInside: boolean = booleanPointInPolygon(targetPoint, area);

    if(!deviceId) return

    if(!isInside) {
      if(isCurrentLive === false) return

      await rejectUser(gameId, deviceId)
      setIsCurrentLive(false)
      Alert.alert('脱落通知', 'エリア外に出たため脱落となりました。', [{text: 'OK'},])
    }
  }

  const gameStart = () => {
    // TODO: ゲームスタート時はエリアの中にいることが前提なので、エリア外にいる場合は警告を出す
    // TODO: 初期値はtrueだが念のため代入する
    setIsCurrentLive(true)
  }

  const resetMarkers = () => {
    pinCount.current = 1;
    setMarkers([]);
  };

  const setDataSettings = ({data}: {data: string}) => {
    // NOTE: カメラモーダルを閉じた際にtrueに戻します。
    // NOTE: QRが画面上にある限り廉造スキャンしてしまうので最初のスキャン以外は早期リターンしている
    if(!firstScan.current || !deviceId) return

    firstScan.current = false
    console.log(data);
    setCameraVisible(false);
    setGameId(data);
    patchDevices(data, deviceId)
  }

  return (
    <>
      <View style={{ position: "absolute", top: 150, right: 5, zIndex: 1 }}>
        <View style={{ display: "flex", gap: 5 }}>
          <Button
            type="solid"
            color={!!isSetDoneArea ? "success" : "primary"}
            onPress={async () => {
              const gameId = await putTagGames(markers);
              setGameId(gameId);
              setIsSetDoneArea(true)

              if(!deviceId) return
              await joinUser(gameId, deviceId)
              putDevices(gameId, deviceId)
              .then(() => {
                console.log("通知設定をdynamoへセット完了")
              })
              .catch((e) => console.error(e));
            }}
          >
            <IconSymbol size={28} name={"mappin.and.ellipse"} color={"white"} />
          </Button>
          <Button type="solid" onPress={resetMarkers}>
            <IconSymbol
              size={28}
              name={"arrow.counterclockwise"}
              color={"white"}
            />
          </Button>
          {/* TODO: MapコンポーネントにQR表示ボタンとカメラ起動ボタンがあるのは適切ではないため、Mapコンポーネント外に切りだす(マップ上に表示しない) */}
          <Button
            type="solid"
            onPress={() => {
              setQrVisible(true);
            }}
          >
            <IconSymbol size={28} name={"qrcode"} color={"white"} />
          </Button>
          <Button
            type="solid"
            onPress={() => {
              setCameraVisible(true);
            }}
          >
            <IconSymbol size={28} name={"camera"} color={"white"} />
          </Button>
        </View>
      </View>
      {mapVisible && (
        <MapView
          style={styles.map}
          showsUserLocation={true}
          followsUserLocation={true}
          showsMyLocationButton={true}
          region={region}
          onLongPress={(event) => {
            setMarkers([
              ...markers,
              { ...event.nativeEvent.coordinate, key: pinCount.current },
            ]);
            pinCount.current += 1;
          }}
          onUserLocationChange={(event) => {
            if(!event.nativeEvent.coordinate) return
            const currentPosition: [number, number] = [event.nativeEvent.coordinate.longitude, event.nativeEvent.coordinate.latitude]
            onChangeCurrentPosition(currentPosition)

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
      )}
      {/* TODO: MapコンポーネントにQR表示ボタンとカメラ起動ボタンの移動に伴いQRモーダルとカメラモーダルも移設する */}
      <ReactNativeModal style={{ margin: "auto" }} isVisible={qrVisible}>
        <View style={{ backgroundColor: "white", width: 330, padding: 20 }}>
          {gameId ? (
            <>
              <Text style={{ fontSize: 30 }}>参加QR</Text>
              <Text>
                {"友達にスキャンしてもらい\nゲームに参加してもらいましょう"}
              </Text>
              <View style={{ alignItems: "center", marginVertical: 20 }}>
                <QRCode size={150} value={gameId} />
              </View>
            </>
          ) : (
            <View style={{ height: 100 }}>
              <Text style={{ fontSize: 15 }}>
                {
                  "ゲームグループQRを表示するためには\nゲームをスタートしてください"
                }
              </Text>
            </View>
          )}
          <Button
            type="solid"
            color={"red"}
            onPress={() => {
              setQrVisible(false);
            }}
          >
            閉じる
          </Button>
        </View>
      </ReactNativeModal>
      <ReactNativeModal style={{ margin: "auto" }} isVisible={cameraVisible}>
        <View style={{ backgroundColor: "white", width: 330, padding: 20 }}>
          <Text style={{ fontSize: 18 }}>
            {"QRを読み込ませてもらって\nゲームグループに参加しましょう!!"}
          </Text>
          <CameraView
            style={{
              width: 250,
              height: 300,
              marginHorizontal: "auto",
              marginBottom: 20,
            }}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={setDataSettings}
            facing={"back"}
          />
          <Button
            type="solid"
            color={"red"}
            onPress={() => {
              setCameraVisible(false);
              firstScan.current = true
            }}
          >
            閉じる
          </Button>
        </View>
      </ReactNativeModal>
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});
