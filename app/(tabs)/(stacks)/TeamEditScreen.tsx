import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { useCameraPermissions } from "expo-camera";
import * as Notifications from "expo-notifications";

import UserStore from "@/stores/UserStore";
import { inject, observer } from "mobx-react";
import { Alert, Button, Text, TouchableOpacity, View } from "react-native";
import { Button as EButton } from "@rneui/themed";
import { UserTypeForList } from "@/components/UserList";
import TagGameStore from "@/stores/TagGameStore";
import UserList from "@/components/UserList";
import _ from "lodash";

import {
  getCurrentGameUsersInfo,
  getTagGames,
  putTagGames,
} from "@/utils/APIs";
import { IconSymbol } from "@/components/ui/IconSymbol";
import ReactNativeModal from "react-native-modal";
import QRCode from "react-native-qrcode-svg";
import UserModel from "@/models/UserModel";
import { router } from "expo-router";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function SettingScreen({ _userStore, _tagGameStore }: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  const formatForListData = (users: UserModel[]) => {
    return users.map((user) => {
      return {
        id: user.getId(),
        name: user.getName(),
        checked: false,
      };
    });
  };

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermissionStatus, setLocationPermissionStatus] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserTypeForList[]>([]);
  const [policeUsersForList, setPoliceUsersForList] = useState<
    UserTypeForList[]
  >(formatForListData(tagGameStore.getPoliceUsers()));
  const [liveUsersForList, setLiveUsersForList] = useState<UserTypeForList[]>(
    formatForListData(tagGameStore.getTagGame().getLiveUsers()),
  );
  const [rejectUsersForList, setRejectUsersForList] = useState<
    UserTypeForList[]
  >(formatForListData(tagGameStore.getTagGame().getRejectUsers()));
  const [qrVisible, setQrVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const deviceId = useRef("");

  Notifications.getDevicePushTokenAsync().then(({ data }) => {
    console.log("deviceId:", data);
    deviceId.current = data;
    userStore.getCurrentUser().setDeviceId(data);
  });

  useEffect(() => {
    if (tagGameStore.getShouldShowGameExplanation()) {
      Alert.alert(
        "チーム設定方法",
        "QRマークを押してみてください。QRが表示されるのでこれをメンバーのアプリ内のメンバー参加リーダーで読み取ってもらってゲームに参加できるようになります。",
      );
    }
  }, []);

  useEffect(() => {
    async function getCurrentLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status;
    }

    getCurrentLocation().then(async (status) => {
      setLocationPermissionStatus(status);
    });
  }, []);

  useEffect(() => {
    const gameId = tagGameStore.getTagGame().getId();
    getTagGames(gameId).then(async (tagGame) => {
      const gameUsers = await getCurrentGameUsersInfo(gameId);
      tagGameStore.updateAllUsers(tagGame, gameUsers);
    });
    setLoading(false);
  }, [loading]);

  useEffect(() => {
    if (locationPermissionStatus === "granted") {
      Location.getCurrentPositionAsync({});
    }
  }, [locationPermissionStatus]);

  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted) {
      requestCameraPermission();
    }
  }, [cameraPermission]);

  useEffect(() => {
    setLiveUsersForList(
      formatForListData(tagGameStore.getTagGame().getLiveUsers()),
    );
    setRejectUsersForList(
      formatForListData(tagGameStore.getTagGame().getRejectUsers() ?? []),
    );
    setPoliceUsersForList(formatForListData(tagGameStore.getPoliceUsers()));
  }, [
    tagGameStore.getTagGame().getLiveUsers(),
    tagGameStore.getTagGame().getRejectUsers(),
    tagGameStore.getPoliceUsers(),
  ]);

  useEffect(() => {
    if (!_.isEmpty(selectedUsers)) return;

    setPoliceUsersForList(formatForListData(tagGameStore.getPoliceUsers()));
    setLiveUsersForList(
      formatForListData(tagGameStore.getTagGame().getLiveUsers()),
    );
    setRejectUsersForList(
      formatForListData(tagGameStore.getTagGame().getRejectUsers() ?? []),
    );
  }, [selectedUsers]);

  const listContentChecked = (userRecord: UserTypeForList) =>
    setSelectedUsers((prevList) => [...prevList, userRecord]);

  const listContentUnChecked = (userRecord: UserTypeForList) =>
    setSelectedUsers((prevList) => {
      return prevList.filter(
        (prevUserRecord) => prevUserRecord.name !== userRecord.name,
      );
    });

  return (
    <View style={{ flex: 1, backgroundColor: "white", position: "relative" }}>
      <View style={{ flex: 1, margin: 10 }}>
        <EButton
          onPress={() => {
            setLoading(true);
          }}
          icon={
            <IconSymbol
              size={28}
              name={"arrow.counterclockwise"}
              color={"white"}
            />
          }
          containerStyle={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 1,
          }}
          buttonStyle={{
            width: 48,
            height: 48,
            borderRadius: 24,
          }}
          color={"error"}
        />
        <Text style={{ textAlign: "center", fontSize: 20 }}>警察</Text>
        <View style={{ flex: 1, borderRadius: 5, borderWidth: 2 }}>
          <UserList
            userRecords={policeUsersForList}
            onChecked={(userRecord) => {
              listContentChecked(userRecord);
              setPoliceUsersForList((prevUsers) =>
                prevUsers.map((user) => {
                  if (user.id !== userRecord.id) return user;

                  user.checked = true;
                  return user;
                }),
              );
            }}
            onUnChecked={(userRecord) => {
              listContentUnChecked(userRecord);
              setPoliceUsersForList((prevUsers) =>
                prevUsers.map((user) => {
                  if (user.id !== userRecord.id) return user;

                  user.checked = false;
                  return user;
                }),
              );
            }}
          />
        </View>
      </View>
      <View style={{ flexDirection: "row", flex: 1 }}>
        <View style={{ flex: 1, margin: 10 }}>
          <Text style={{ textAlign: "center", fontSize: 20 }}>泥棒(生存)</Text>
          <View style={{ flex: 1, borderRadius: 5, borderWidth: 2 }}>
            <UserList
              userRecords={liveUsersForList}
              onChecked={(userRecord) => {
                listContentChecked(userRecord);
                setLiveUsersForList((prevUsers) =>
                  prevUsers.map((user) => {
                    if (user.id !== userRecord.id) return user;

                    user.checked = true;
                    return user;
                  }),
                );
              }}
              onUnChecked={(userRecord) => {
                listContentUnChecked(userRecord);
                setLiveUsersForList((prevUsers) =>
                  prevUsers.map((user) => {
                    if (user.id !== userRecord.id) return user;

                    user.checked = false;
                    return user;
                  }),
                );
              }}
            />
          </View>
        </View>
        <View style={{ flex: 1, margin: 10 }}>
          <Text style={{ textAlign: "center", fontSize: 20 }}>泥棒(脱落)</Text>
          <View style={{ flex: 1, borderRadius: 5, borderWidth: 2 }}>
            <UserList
              userRecords={rejectUsersForList}
              onChecked={(userRecord) => {
                listContentChecked(userRecord);
                setRejectUsersForList((prevUsers) =>
                  prevUsers.map((user) => {
                    if (user.id !== userRecord.id) return user;

                    user.checked = true;
                    return user;
                  }),
                );
              }}
              onUnChecked={(userRecord) => {
                listContentUnChecked(userRecord);
                setRejectUsersForList((prevUsers) =>
                  prevUsers.map((user) => {
                    if (user.id !== userRecord.id) return user;

                    user.checked = false;
                    return user;
                  }),
                );
              }}
            />
          </View>
        </View>
      </View>
      <View>
        <View>
          <View
            style={{
              flexDirection: "row",
              margin: 20,
              justifyContent: "flex-end",
            }}
          >
            <View>
              <View
                style={{
                  marginHorizontal: "auto",
                  flexDirection: "row",
                  justifyContent: "space-around",
                }}
              >
                <View style={{ width: "33%" }}>
                  <Button
                    title="追放"
                    onPress={() => {
                      tagGameStore.kickOutUsers(
                        selectedUsers.map(
                          UserModel.convertListTypeUserToUserModel,
                        ),
                      );
                      setSelectedUsers([]);
                    }}
                  />
                </View>
                <View style={{ width: "33%", marginLeft: 10 }}>
                  <Button
                    title="警察へ変更"
                    onPress={() => {
                      tagGameStore.changeToPolice(
                        selectedUsers.map(
                          UserModel.convertListTypeUserToUserModel,
                        ),
                      );
                      setSelectedUsers([]);
                    }}
                  />
                </View>
                <View style={{ width: "33%", marginLeft: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setQrVisible(true);
                    }}
                    style={{
                      backgroundColor: "blue",
                      paddingVertical: "auto",
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <IconSymbol size={30} name={"qrcode"} color={"white"} />
                  </TouchableOpacity>
                </View>
              </View>
              <View
                style={{
                  marginHorizontal: "auto",
                  flexDirection: "row",
                  marginTop: 10,
                }}
              >
                <View style={{ width: "33%" }}>
                  <Button
                    title="泥棒(生存)に変更"
                    onPress={async () => {
                      const location = await Location.getCurrentPositionAsync({});
                      const userLocation = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                      };

                      if (!tagGameStore.isUserInPrisonArea(userLocation)) {
                        Alert.alert("エラー", "監獄エリア内でのみ生還ボタンを押すことができます。");
                        return;
                      }

                      tagGameStore.changeToLiveThief(
                        selectedUsers.map(
                          UserModel.convertListTypeUserToUserModel,
                        ),
                      );
                      setSelectedUsers([]);
                    }}
                  />
                </View>
                <View style={{ width: "33%", marginLeft: 10 }}>
                  <Button
                    title="泥棒(脱落)に変更"
                    onPress={() => {
                      tagGameStore.changeToRejectThief(
                        selectedUsers.map(
                          UserModel.convertListTypeUserToUserModel,
                        ),
                      );
                      setSelectedUsers([]);
                    }}
                  />
                </View>
                <View
                  style={{
                    width: "33%",
                    marginLeft: 10,
                    backgroundColor: "green",
                  }}
                >
                  <TouchableOpacity
                    onPress={async () => {
                      if (tagGameStore.getShouldShowGameExplanation()) {
                        router.replace("/GameTimeScreen");
                        return;
                      }

                      setSelectedUsers([]);
                      try {
                        // TODO: 先にエリアを設定しないとidが設定されず、dynamo not keyエラーが発生してしまう
                        // idはマップコンポーネントではなくて設定画面でゲーム生成ボタンなどの押下時に格納するよう変更する
                        await putTagGames(tagGameStore.getTagGame().toObject());
                        tagGameStore.setIsEditTeams(true);
                      } catch (error) {
                        console.log("Error: ", error);
                        throw error;
                      }
                    }}
                    style={{
                      backgroundColor: tagGameStore.getIsEditTeams()
                        ? "green"
                        : "red",
                      paddingVertical: "auto",
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      確定
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
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
            title="閉じる"
            color={"red"}
            onPress={() => {
              setQrVisible(false);
            }}
          />
        </View>
      </ReactNativeModal>
    </View>
  );
}

export default inject("_userStore", "_tagGameStore")(observer(SettingScreen));
