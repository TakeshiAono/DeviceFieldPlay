import { Alert, StyleSheet, View } from "react-native";
import React, { useState, useEffect } from "react";
import MapView, { LatLng, Polygon, Region } from "react-native-maps";
import { booleanPointInPolygon, point, polygon } from "@turf/turf";
import "react-native-get-random-values";
import _ from "lodash";
import { inject, observer } from "mobx-react";
import * as Notifications from "expo-notifications";
import { CopilotStep } from "react-native-copilot";

import { rejectUser, reviveUser } from "@/utils/APIs";
import { IconSymbol } from "@/components/ui/IconSymbol";
import UserStore from "@/stores/UserStore";
import TagGameStore from "@/stores/TagGameStore";
import { initialJapanRegion } from "./EditMap";
import {
  gameTimeUpNotificationHandler,
  gameStartNotificationHandler,
  gameStopNotificationHandler,
  joinUserNotificationHandler,
  kickOutUsersNotificationHandler,
  liveUserNotificationHandler,
  policeUserNotificationHandler,
  prisonAreaNotificationHandler,
  rejectUserNotificationHandler,
  validAreaNotificationHandler,
} from "@/utils/Notifications";
import { Text } from "react-native";
import { getPlayerRoleColor } from "@/constants/Colors";
import useCopilotHook from "@/hooks/useCopilotHook";

export type Props = {
  mapVisible?: boolean;
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
  validPoints: LatLng[];
  validPointsDrawColor: string;
  prisonPoints: LatLng[];
  prisonPointsDrawColor: string;
};

type latitude = number;
type longitude = number;

function ShowMap({
  mapVisible = true,
  _userStore,
  _tagGameStore,
  validPoints,
  validPointsDrawColor,
  prisonPoints,
  prisonPointsDrawColor,
}: Props) {
  const [region, setRegion] = useState<Region>(initialJapanRegion);
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  const [isFirstUpdate, setIsFirstUpdate] = useState(true);
  const [setIsStart, CopilotTouchableOpacity, CopilotView] = useCopilotHook(
    userStore,
    tagGameStore,
    "roleDisplay",
    ["plusButton", "roleDisplay", "minusButton"],
    "/(tabs)/(stacks)",
  );

  useEffect(() => {
    if (tagGameStore.getShouldShowGameExplanation()) {
      setTimeout(() => {
        setIsStart(true);
      }, 500);
    }
  }, [userStore.getCurrentUser().getName()]);

  useEffect(() => {
    const gameId = tagGameStore.getTagGame().getId();
    // TODO: このブロックの処理が新規作成時と更新時両方で発火し複雑なためリファクタリングが必要
    if (_.isEmpty(gameId)) return;

    const joinUserNotificationListener =
      Notifications.addNotificationReceivedListener((event) => {
        if (tagGameStore.getShouldShowGameExplanation()) {
          Alert.alert(
            "チーム設定方法",
            "メンバーがゲームに参加できましたね。\nゲームマスターさんはゲーム参加者の役割を決めてから確定ボタンで編集を完了しましょう。\nメンバーさんはゲームスタートの通知がくるのを待つだけです。",
          );

          if (!userStore.isCurrentUserGameMaster(tagGameStore.getTagGame())) {
            tagGameStore.setShouldShowGameExplanation(false);
          }
        }
        joinUserNotificationHandler(event, gameId, tagGameStore);
      });

    const kickOutUsersNotificationListener =
      Notifications.addNotificationReceivedListener((event) => {
        kickOutUsersNotificationHandler(event, gameId, tagGameStore);
      });

    // ゲーム有効エリア変更時の通知を受け取って自分の持っているエリア情報を更新する
    const changeValidAreaNotificationListener =
      Notifications.addNotificationReceivedListener((event) => {
        validAreaNotificationHandler(event, gameId, tagGameStore);
      });

    // 監獄エリア変更時の通知を受け取って自分の持っているエリア情報を更新する
    const changePrisonAreaNotificationListener =
      Notifications.addNotificationReceivedListener((event) => {
        prisonAreaNotificationHandler(event, gameId, tagGameStore);
      });

    const rejectUserNotificationListener =
      Notifications.addNotificationReceivedListener((event) => {
        rejectUserNotificationHandler(event, gameId, tagGameStore);
      });

    const reviveUserNotificationListener =
      Notifications.addNotificationReceivedListener((event) => {
        liveUserNotificationHandler(event, gameId, tagGameStore);
      });

    const policeUserNotificationListener =
      Notifications.addNotificationReceivedListener((event) => {
        policeUserNotificationHandler(event, gameId, tagGameStore);
      });

    const gameStartNotificationListener =
      Notifications.addNotificationReceivedListener((event) => {
        gameStartNotificationHandler(event, gameId, tagGameStore);
      });

    const gameTimeUpNotificationListener =
      Notifications.addNotificationReceivedListener((event) => {
        gameTimeUpNotificationHandler(event, tagGameStore);
      });

    const gameStopNotificationListener =
      Notifications.addNotificationReceivedListener((event) => {
        gameStopNotificationHandler(event, gameId, tagGameStore);
      });

    // gameIdが変わるたびに別のゲームのエリアで更新されてしまわないよう、イベントリスナーを削除し新規のイベントリスナーを生成する。
    return () => {
      joinUserNotificationListener.remove();
      kickOutUsersNotificationListener.remove();
      changeValidAreaNotificationListener.remove();
      changePrisonAreaNotificationListener.remove();
      rejectUserNotificationListener.remove();
      reviveUserNotificationListener.remove();
      policeUserNotificationListener.remove();
      gameStartNotificationListener.remove();
      gameTimeUpNotificationListener.remove();
      gameStopNotificationListener.remove();
    };
  }, [tagGameStore.getTagGame().getId()]);

  const onChangeCurrentPosition = async (
    userPosition: [longitude, latitude],
  ) => {
    if (
      validPoints.length === 0 ||
      !tagGameStore.getTagGame().getIsSetValidAreaDone()
    )
      return;

    const userPositionPoint = point(userPosition);

    // TODO: areaを毎回計算するのはパフォーマンス効率が悪いため、エリア変更時にuseRefで保存するように変更する
    const targetPolygon = validPoints.map((point) => [
      point.longitude,
      point.latitude,
    ]);
    const areaPoint = polygon([targetPolygon]);
    const isInside: boolean = booleanPointInPolygon(
      userPositionPoint,
      areaPoint,
    );

    if (!userStore.getCurrentUser().getDeviceId()) return;

    if (!isInside) {
      if (tagGameStore.isCurrentUserReject(userStore.getCurrentUser())) return;

      await rejectUser(
        tagGameStore.getTagGame().getId(),
        userStore.getCurrentUser().getDeviceId(),
      );
      Alert.alert("脱落通知", "エリア外に出たため脱落となりました。", [
        { text: "OK" },
      ]);
    }
  };

  const shouldStartExplanation = () => {
    return tagGameStore.getShouldShowGameExplanation();
  };

  const liveButtonExplanation =
    "監獄エリアで味方に生還してもらった時にこのボタンを押してください";
  const rejectButtonExplanation =
    "警察に捕まった時に泥棒ユーザーはこのボタンを押してください";
  const roleDisplayExplanation =
    "あなたの役職名とユーザー名が表示されます。\n泥棒(生存中)は黒\n泥棒(捕縛中)は赤\n警察は青色\nで表示されます";

  return (
    <>
      <View style={{ position: "absolute", top: 150, right: 5, zIndex: 1 }}>
        <View style={{ display: "flex", gap: 5 }}>
          {shouldStartExplanation() && (
            <>
              <CopilotStep
                text={liveButtonExplanation}
                order={3}
                name="plusButton"
              >
                <CopilotTouchableOpacity
                  style={{
                    height: 50,
                    width: 50,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 2,
                    backgroundColor: tagGameStore.isCurrentUserReject(
                      userStore.getCurrentUser(),
                    )
                      ? "success"
                      : "gray",
                  }}
                  onPress={
                    tagGameStore.isCurrentUserReject(userStore.getCurrentUser())
                      ? () => {
                          Alert.alert("復活", "復活してもよいですか？", [
                            { text: "Cancel", onPress: undefined },
                            {
                              text: "OK",
                              onPress: async () => {
                                if (!userStore.getCurrentUser().getDeviceId())
                                  return;

                                try {
                                  await reviveUser(
                                    tagGameStore.getTagGame().getId(),
                                    userStore.getCurrentUser().getId(),
                                  );
                                } catch (error) {
                                  console.error(error);
                                }
                              },
                            },
                          ]);
                        }
                      : undefined
                  }
                >
                  <IconSymbol
                    size={28}
                    name={"person.badge.plus"}
                    color={"white"}
                  />
                </CopilotTouchableOpacity>
              </CopilotStep>
              <CopilotStep
                text={rejectButtonExplanation}
                order={2}
                name="minusButton"
              >
                <CopilotTouchableOpacity
                  style={{
                    height: 50,
                    width: 50,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 2,
                    backgroundColor: tagGameStore.isCurrentUserReject(
                      userStore.getCurrentUser(),
                    )
                      ? "success"
                      : "gray",
                  }}
                  onPress={
                    tagGameStore.isCurrentUserReject(userStore.getCurrentUser())
                      ? () => {
                          Alert.alert("復活", "復活してもよいですか？", [
                            { text: "Cancel", onPress: undefined },
                            {
                              text: "OK",
                              onPress: async () => {
                                if (!userStore.getCurrentUser().getDeviceId())
                                  return;

                                try {
                                  await reviveUser(
                                    tagGameStore.getTagGame().getId(),
                                    userStore.getCurrentUser().getId(),
                                  );
                                } catch (error) {
                                  console.error(error);
                                }
                              },
                            },
                          ]);
                        }
                      : undefined
                  }
                >
                  <IconSymbol
                    size={28}
                    name={"person.badge.plus"}
                    color={"white"}
                  />
                </CopilotTouchableOpacity>
              </CopilotStep>
            </>
          )}
        </View>
      </View>

      {mapVisible && (
        <View style={{ position: "relative" }}>
          <MapView
            style={styles.map}
            showsUserLocation={true}
            followsUserLocation={true}
            showsMyLocationButton={true}
            region={region}
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
            {validPoints.length > 0 && (
              <Polygon
                fillColor={validPointsDrawColor}
                coordinates={validPoints} // 東京
              />
            )}
            {prisonPoints.length > 0 && (
              <Polygon
                fillColor={prisonPointsDrawColor}
                coordinates={prisonPoints} // 東京
              />
            )}
          </MapView>
          <CopilotStep
            text={roleDisplayExplanation}
            order={1}
            name="roleDisplay"
          >
            {userStore.getCurrentUser().getName().length > 0 ? (
              <CopilotView
                style={{
                  backgroundColor: "white",
                  width: "auto",
                  position: "absolute",
                  top: 0,
                  borderColor: getPlayerRoleColor(tagGameStore, userStore),
                  borderWidth: 10,
                  padding: 5,
                }}
              >
                <Text style={{ fontWeight: "900" }}>
                  {userStore.getPlayerRoleName(tagGameStore) ||
                    "ロール未設定" +
                      ": " +
                      userStore.getCurrentUser().getName()}
                </Text>
              </CopilotView>
            ) : (
              <></>
            )}
          </CopilotStep>
        </View>
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

export default inject("_userStore", "_tagGameStore")(observer(ShowMap));
