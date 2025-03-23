import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "@rneui/themed";
import React, { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "react-native-qrcode-svg";
import MapView, { LatLng, Marker, Polyline, Region } from "react-native-maps";
import ReactNativeModal from "react-native-modal";
import { CameraView } from "expo-camera";
import { booleanPointInPolygon, point, polygon } from "@turf/turf";
import "react-native-get-random-values";
import * as Crypto from "expo-crypto";
import _ from "lodash";
import { inject, observer } from "mobx-react";
import Toast from "react-native-toast-message";
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
import TagGameModel from "@/models/TagGameModel";
import TagGameStore from "@/stores/TagGameStore";

export type Marker = LatLng & { key: number };
export type Props = {
  mapVisible?: boolean;
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
};

const initialJapanRegion = {
  latitude: 36.2048,
  longitude: 138.2529,
  latitudeDelta: 0.001,
  longitudeDelta: 0.001,
};

type latitude = number;
type longitude = number;

function Map({ mapVisible = true, _userStore, _tagGameStore }: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  const [region, setRegion] = useState<Region>(initialJapanRegion);
  const [isSetDoneArea, setIsSetDoneArea] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [isFirstUpdate, setIsFirstUpdate] = useState(true);
  const [isCurrentUserLive, setIsCurrentUserLive] = useState(true);

  const pinCount = useRef(1);
  const firstScan = useRef(true);
  const isGameStartDone = useRef(false);

  useEffect(() => {
    const gameId = tagGameStore.getTagGame().getId();
    // TODO: このブロックの処理が新規作成時と更新時両方で発火し複雑なためリファクタリングが必要
    if (_.isEmpty(gameId)) return;

    // エリア変更時の通知を受け取って自分の持っているエリア情報を更新する
    const changeAreaNotificationListener =
      Notifications.addNotificationReceivedListener(async (notification) => {
        if (
          notification.request.content.data.notification_type !== "changeArea"
        )
          return;
        console.log("エリア変更push通知", notification.request.content);

        Toast.show({
          type: "info",
          text1: notification.request.content.title as string,
          text2: notification.request.content.body as string,
        });

        try {
          const tagGame = await getTagGames(gameId);
          tagGameStore.putArea(tagGame.areas);
        } catch (error) {
          console.error("Error: ", error);
        }
      });

    const rejectUserNotificationListener =
      Notifications.addNotificationReceivedListener(async (notification) => {
        if (
          notification.request.content.data.notification_type !== "rejectUser"
        )
          return;
        console.log("脱落push通知", notification.request.content);

        Toast.show({
          type: "error",
          text1: notification.request.content.title as string,
          text2: notification.request.content.body as string,
        });

        try {
          const tagGame = await getTagGames(gameId);
          tagGameStore.putRejectUsers(tagGame.rejectUsers);
        } catch (error) {
          console.error("Error: ", error);
        }
      });

    const reviveUserNotificationListener =
      Notifications.addNotificationReceivedListener(async (notification) => {
        if (
          notification.request.content.data.notification_type !== "reviveUser"
        )
          return;
        console.log("復活push通知", notification.request.content);

        Toast.show({
          type: "success",
          text1: notification.request.content.title as string,
          text2: notification.request.content.body as string,
        });

        try {
          const tagGame = await getTagGames(gameId);
          tagGameStore.putLiveUsers(tagGame.liveUsers);
        } catch (error) {
          console.error("Error: ", error);
        }
      });

    gameStart();
    // gameIdが変わるたびに別のゲームのエリアで更新されてしまわないよう、イベントリスナーを削除し新規のイベントリスナーを生成する。
    return () => {
      changeAreaNotificationListener.remove();
      rejectUserNotificationListener.remove();
      reviveUserNotificationListener.remove();
    };
  }, [tagGameStore.getTagGame().getId()]);

  const onChangeCurrentPosition = async (position: [longitude, latitude]) => {
    if (tagGameStore.getTagGame().getAreas().length === 0 || !isSetDoneArea)
      return;

    const targetPolygon = tagGameStore
      .getTagGame()
      .getAreas()
      .map((marker) => [marker.longitude, marker.latitude]);
    const targetPoint = point(position);

    // TODO: areaを毎回計算するのはパフォーマンス効率が悪いため、エリア変更時にuseRefで保存するように変更する
    const area = polygon([targetPolygon]);
    const isInside: boolean = booleanPointInPolygon(targetPoint, area);

    if (!userStore.getCurrentUser().getDeviceId()) return;

    if (!isInside) {
      if (isCurrentUserLive === false) return;

      await rejectUser(
        tagGameStore.getTagGame().getId(),
        userStore.getCurrentUser().getDeviceId() as string,
      );
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
    tagGameStore.putArea([]);
  };

  const setDataSettings = async ({ data: gameId }: { data: string }) => {
    // NOTE: カメラモーダルを閉じた際にtrueに戻します。
    // NOTE: QRが画面上にある限り廉造スキャンしてしまうので最初のスキャン以外は早期リターンしている
    if (!firstScan.current || !userStore.getCurrentUser().getDeviceId()) return;

    firstScan.current = false;
    console.log("ScanData: ", gameId);
    setCameraVisible(false);
    tagGameStore.getTagGame().setId(gameId);
    await patchDevices(gameId, userStore.getCurrentUser().getDeviceId());

    const updatedLiveUsers = await joinUser(
      gameId,
      userStore.getCurrentUser().getDeviceId(),
    );

    const tagGame = new TagGameModel({
      id: gameId,
      areas: tagGameStore.getTagGame().getAreas(),
      liveUsers: updatedLiveUsers.liveUsers,
      rejectUsers: [],
      // TODO: ゲームマスターを取得できるようにしたい。現状は自分がげーむマスターでないことしかわからない
      gameMasterDeviceId: "",
    });
    tagGameStore.putTagGame(tagGame);
  };

  const storeGameStartSetting = async (gameId: string) => {
    try {
      await joinUser(
        gameId,
        userStore.getCurrentUser().getDeviceId() as string,
      );
      await putUser(gameId, userStore.getCurrentUser() as UserModel);
      if(!isGameStartDone.current) await putDevices(gameId, userStore.getCurrentUser().getDeviceId());

      console.log("通知設定をdynamoへセット完了");
      isGameStartDone.current = true
    } catch (error) {
      console.log(error);
    }
  };

  const isGameMaster = () => {
    return userStore
      .getCurrentUser()
      .isCurrentGameMaster(tagGameStore.getTagGame());
  };

  return (
    <>
      <View style={{ position: "absolute", top: 150, right: 5, zIndex: 1 }}>
        <View style={{ display: "flex", gap: 5 }}>
          {(isGameMaster() || !tagGameStore.getTagGame().isSetGame()) && (
            <>
              <Button
                type="solid"
                color={!!isSetDoneArea ? "success" : "primary"}
                disabled={
                  !(isGameMaster() || !tagGameStore.getTagGame().isSetGame())
                }
                onPress={async () => {
                  const tagGame = tagGameStore.getTagGame();
                  if (_.isEmpty(tagGame.getId())) {
                    tagGame.setId(Crypto.randomUUID());
                  }
                  if (_.isEmpty(tagGame.getGameMasterDeviceId())) {
                    tagGame.setGameMasterDeviceId(
                      userStore.getCurrentUser().getDeviceId(),
                    );
                  }

                  await putTagGames(tagGame.toObject());
                  setIsSetDoneArea(true);

                  if (!userStore.getCurrentUser().getDeviceId()) return;
                  await storeGameStartSetting(tagGame.getId());
                }}
              >
                <IconSymbol
                  size={28}
                  name={"mappin.and.ellipse"}
                  color={"white"}
                />
              </Button>
              <Button
                type="solid"
                onPress={() => {
                  resetMarkers();
                  setIsSetDoneArea(false);
                }}
                disabled={
                  !(isGameMaster() || !tagGameStore.getTagGame().isSetGame())
                }
              >
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
                disabled={
                  !(isGameMaster() || !tagGameStore.getTagGame().isSetGame())
                }
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
            </>
          )}
          <Button
            type="solid"
            color={isCurrentUserLive ? "gray" : "success"}
            onPress={
              isCurrentUserLive
                ? undefined
                : () => {
                    Alert.alert("復活", "復活してもよいですか？", [
                      { text: "Cancel", onPress: undefined },
                      {
                        text: "OK",
                        onPress: async () => {
                          if (!userStore.getCurrentUser().getDeviceId()) return;

                          try {
                            await reviveUser(
                              tagGameStore.getTagGame().getId(),
                              userStore.getCurrentUser().getDeviceId(),
                            );
                            setIsCurrentUserLive(true);
                          } catch (error) {
                            console.error(error);
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
            color={
              !isCurrentUserLive || !tagGameStore.getTagGame().getId()
                ? "gray"
                : "error"
            }
            onPress={
              !isCurrentUserLive || !tagGameStore.getTagGame().getId()
                ? undefined
                : () => {
                    Alert.alert("脱落", "脱落してもよいですか？", [
                      { text: "Cancel", onPress: undefined },
                      {
                        text: "OK",
                        onPress: async () => {
                          if (!userStore.getCurrentUser().getDeviceId()) return;

                          try {
                            await rejectUser(
                              tagGameStore.getTagGame().getId(),
                              userStore.getCurrentUser().getDeviceId(),
                            );
                            setIsCurrentUserLive(false);
                          } catch (error) {
                            console.error(error);
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
            if (!(isGameMaster() || !tagGameStore.getTagGame().isSetGame()))
              return;

            tagGameStore.putArea([
              ...tagGameStore.getTagGame().getAreas(),
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
          {tagGameStore
            .getTagGame()
            .getAreas()
            .map((marker) => (
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
            coordinates={tagGameStore.getTagGame().getAreas()}
            strokeWidth={5} // 線の太さ
            strokeColor="blue" // 線の色
          />
        </MapView>
      )}
      {/* TODO: MapコンポーネントにQR表示ボタンとカメラ起動ボタンの移動に伴いQRモーダルとカメラモーダルも移設する */}
      <ReactNativeModal style={{ margin: "auto" }} isVisible={qrVisible}>
        <View style={{ backgroundColor: "white", width: 330, padding: 20 }}>
          {tagGameStore.getTagGame().getId() ? (
            <>
              <Text style={{ fontSize: 30 }}>参加QR</Text>
              <Text>
                {"友達にスキャンしてもらい\nゲームに参加してもらいましょう"}
              </Text>
              <View style={{ alignItems: "center", marginVertical: 20 }}>
                <QRCode size={150} value={tagGameStore.getTagGame().getId()} />
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

export default inject("_userStore", "_tagGameStore")(observer(Map));
