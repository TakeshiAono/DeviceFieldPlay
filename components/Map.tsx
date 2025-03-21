import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "@rneui/themed";
import React, { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "react-native-qrcode-svg";
import MapView, { LatLng, Marker, Polyline, Region } from "react-native-maps";
import ReactNativeModal from "react-native-modal";
import { CameraView } from "expo-camera";
import { booleanPointInPolygon, point, polygon } from "@turf/turf";
import 'react-native-get-random-values';
import * as Crypto from "expo-crypto";
import _ from "lodash";
import { inject, observer } from "mobx-react";
import Toast from 'react-native-toast-message';
import * as Notifications from "expo-notifications";

import {
  getTagGames,
  joinUser,
  patchDevices,
  putDevices,
  putTagGames,
  putUser,
  rejectUser,
  reviveUser,
} from "@/utils/APIs";
import { IconSymbol } from "@/components/ui/IconSymbol";
import UserStore from "@/stores/UserStore";
import UserModel from "@/models/UserModel";

export type Marker = LatLng & { key: number };
export type Props = {
  mapVisible?: boolean;
  userStore?: UserStore;
};

const initialJapanRegion = {
  latitude: 36.2048,
  longitude: 138.2529,
  latitudeDelta: 0.001,
  longitudeDelta: 0.001,
};

type latitude = number;
type longitude = number;

function Map({ mapVisible = true, userStore }: Props) {
  const [region, setRegion] = useState<Region>(initialJapanRegion);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [gameId, setGameId] = useState("");
  const [isSetDoneArea, setIsSetDoneArea] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [isFirstUpdate, setIsFirstUpdate] = useState(true);
  const [isCurrentUserLive, setIsCurrentUserLive] = useState(true);

  const pinCount = useRef(1);
  const firstScan = useRef(true);

  useEffect(() => {
    if (!gameId) return;

    // エリア変更時の通知を受け取って自分の持っているエリア情報を更新する
    const changeAreaNotificationListener = Notifications.addNotificationReceivedListener(async notification => {
      console.log("push通知",notification.request.content)
      if(notification.request.content.data.notification_type !== "changeArea") return

      Toast.show({
        type: "info",
        text1: notification.request.content.title as string,
        text2: notification.request.content.body as string
      });

      getTagGames(gameId)
        .then((res) => {
          setMarkers(res?.areas);
        })
        .catch((e) => console.error(e));
    });

    const rejectUserNotificationListener = Notifications.addNotificationReceivedListener(async notification => {
      console.log("push通知",notification.request.content)
      if(notification.request.content.data.notification_type !== "rejectUser") return

      Toast.show({
        type: "error",
        text1: notification.request.content.title as string,
        text2: notification.request.content.body as string
      });

      getTagGames(gameId)
    });

    const reviveUserNotificationListener = Notifications.addNotificationReceivedListener(async notification => {
      console.log("push通知",notification.request.content)
      if(notification.request.content.data.notification_type !== "reviveUser") return

      Toast.show({
        type: "success",
        text1: notification.request.content.title as string,
        text2: notification.request.content.body as string
      });

      getTagGames(gameId)
    });

    getTagGames(gameId)
      .then((res) => {
        setMarkers(res?.areas);
        gameStart();
      })
      .catch((e) => console.error(e));

    // gameIdが変わるたびに別のゲームのエリアで更新されてしまわないよう、イベントリスナーを削除し新規のイベントリスナーを生成する。
    return () => {
      changeAreaNotificationListener.remove();
      rejectUserNotificationListener.remove();
      reviveUserNotificationListener.remove();
    };
  }, [gameId]);

  const onChangeCurrentPosition = async (position: [longitude, latitude]) => {
    if (markers.length === 0 || !isSetDoneArea) return;

    const targetPolygon = markers.map((marker) => [
      marker.longitude,
      marker.latitude,
    ]);
    const targetPoint = point(position);

    // TODO: areaを毎回計算するのはパフォーマンス効率が悪いため、エリア変更時にuseRefで保存するように変更する
    const area = polygon([targetPolygon]);
    const isInside: boolean = booleanPointInPolygon(targetPoint, area);

    if (!userStore?.getCurrentUser()?.getDeviceId()) return;

    if (!isInside) {
      if (isCurrentUserLive === false) return;

      await rejectUser(gameId, userStore?.getCurrentUser()?.getDeviceId() as string);
      setIsCurrentUserLive(false);
      Alert.alert("脱落通知", "エリア外に出たため脱落となりました。", [
        { text: "OK" },
      ]);
    }
  };

  const gameStart = () => {
    // TODO: ゲームスタート時はエリアの中にいることが前提なので、エリア外にいる場合は警告を出す
    // TODO: 初期値はtrueだが念のため代入する
    setIsCurrentUserLive(true);
  };

  const resetMarkers = () => {
    pinCount.current = 1;
    setMarkers([]);
  };

  const setDataSettings = ({ data }: { data: string }) => {
    // NOTE: カメラモーダルを閉じた際にtrueに戻します。
    // NOTE: QRが画面上にある限り廉造スキャンしてしまうので最初のスキャン以外は早期リターンしている
    if (!firstScan.current || !userStore?.getCurrentUser()?.getDeviceId()) return;

    firstScan.current = false;
    console.log(data);
    setCameraVisible(false);
    setGameId(data);
    patchDevices(data, userStore?.getCurrentUser()?.getDeviceId() as string);
  };

  const storeGameStartSetting = async (gameId: string) => {
    try {
      await joinUser(gameId, userStore?.getCurrentUser()?.getDeviceId() as string);
      await putUser(gameId, userStore?.getCurrentUser() as UserModel);
      await putDevices(gameId, userStore?.getCurrentUser()?.getDeviceId() as string)

      console.log("通知設定をdynamoへセット完了");
    } catch (error) {
      console.log(error)
    }
}

  return (
    <>
      <View style={{ position: "absolute", top: 150, right: 5, zIndex: 1 }}>
        <View style={{ display: "flex", gap: 5 }}>
          <Button
            type="solid"
            color={!!isSetDoneArea ? "success" : "primary"}
            onPress={async () => {
              const targetGameId = _.isEmpty(gameId) ? Crypto.randomUUID() : gameId
              await putTagGames(targetGameId, markers);
              setGameId(targetGameId);
              setIsSetDoneArea(true);

              if (!userStore?.getCurrentUser()?.getDeviceId()) return;
              await storeGameStartSetting(targetGameId)
            }}
          >
            <IconSymbol size={28} name={"mappin.and.ellipse"} color={"white"} />
          </Button>
          <Button type="solid" onPress={() => {
            resetMarkers()
            setIsSetDoneArea(false);
          }}>
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
          <Button
            type="solid"
            color={isCurrentUserLive ? "gray" : "success"}
            onPress={
              isCurrentUserLive
                ? undefined
                : () => {
                    Alert.alert("復活", "復活してもよいですか？", [
                      {text: 'Cancel', onPress: undefined},
                      {
                        text: "OK",
                        onPress: async () => {
                          if (!userStore?.getCurrentUser()?.getDeviceId()) return;

                          try {
                            await reviveUser(gameId, userStore?.getCurrentUser()?.getDeviceId() as string);
                            setIsCurrentUserLive(true)
                          } catch (error) {
                            console.error(error)
                          }
                        },
                      },
                    ]);
                  }
            }
          >
            <IconSymbol size={28} name={"person.badge.plus"} color={"white"} />
          </Button>
          <Button
            type="solid"
            color={!isCurrentUserLive || !gameId ? "gray" : "error"}
            onPress={
              !isCurrentUserLive || !gameId
                ? undefined
                : () => {
                    Alert.alert("脱落", "脱落してもよいですか？", [
                      {text: 'Cancel', onPress: undefined},
                      {
                        text: "OK",
                        onPress: async () => {
                          if (!userStore?.getCurrentUser()?.getDeviceId()) return;

                          try {
                            await rejectUser(gameId, userStore?.getCurrentUser()?.getDeviceId() as string);
                            setIsCurrentUserLive(false)
                          } catch (error) {
                            console.error(error)
                          }
                        },
                      },
                    ]);
                  }
            }
          >
            <IconSymbol size={28} name={"person.badge.minus"} color={"white"} />
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
              firstScan.current = true;
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

export default inject("userStore")(observer(Map));
