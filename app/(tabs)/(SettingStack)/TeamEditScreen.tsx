import { useState, useEffect, useRef } from "react";
import { useCameraPermissions } from "expo-camera";
import i18next from "i18next";

import UserStore from "@/stores/UserStore";
import { inject, observer } from "mobx-react";
import { Alert, Button, Text, TouchableOpacity, View } from "react-native";
import { Button as EButton } from "@rneui/themed";
import UserCheckList, { UserTypeForList } from "@/components/UserCheckList";
import TagGameStore from "@/stores/TagGameStore";
import _ from "lodash";
import { getDevicePushTokenAsync } from "expo-notifications";

import {
  fetchCurrentGameUsersInfo,
  fetchTagGames,
  putTagGames,
} from "@/utils/dynamoUtils";
import { IconSymbol } from "@/components/ui/IconSymbol";
import ReactNativeModal from "react-native-modal";
import QRCode from "react-native-qrcode-svg";
import UserModel from "@/models/UserModel";
import { router } from "expo-router";
import { getCurrentPositionAsync } from "expo-location";
import { getLocationPermissionStatus } from "@/utils/Policies";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function TeamEditScreen({ _userStore, _tagGameStore }: Props) {
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

  getDevicePushTokenAsync().then(({ data }) => {
    console.log("deviceId:", data);
    deviceId.current = data;
    userStore.getCurrentUser().setDeviceId(data);
  });

  useEffect(() => {
    if (tagGameStore.getShouldShowGameExplanation()) {
      Alert.alert(
        i18next.t("Team Setting Method"),
        i18next.t(
          "Press the QR mark and a QR code will be displayed. Have members scan it with the camera in their app to join the game.",
        ),
      );
    }
  }, []);

  useEffect(() => {
    getLocationPermissionStatus().then(async (status) => {
      setLocationPermissionStatus(status);
    });
  }, []);

  useEffect(() => {
    const gameId = tagGameStore.getTagGame().getId();
    fetchTagGames(gameId).then(async (tagGame) => {
      const gameUsers = await fetchCurrentGameUsersInfo(gameId);
      tagGameStore.updateAllUsers(tagGame, gameUsers);
    });
    setLoading(false);
  }, [loading]);

  useEffect(() => {
    if (locationPermissionStatus === "granted") {
      getCurrentPositionAsync({});
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

  const isInValidRoleCount = () => {
    const liveCount = tagGameStore.getTagGame().getLiveUsers().length;
    const policeCount = tagGameStore.getPoliceUsers().length;
    return liveCount < 1 || policeCount < 1;
  };

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
          <UserCheckList
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
          <Text style={{ textAlign: "center", fontSize: 20 }}>
            {i18next.t("Thief (Alive)")}
          </Text>
          <View style={{ flex: 1, borderRadius: 5, borderWidth: 2 }}>
            <UserCheckList
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
          <Text style={{ textAlign: "center", fontSize: 20 }}>
            {i18next.t("Thief (Arrested)")}
          </Text>
          <View style={{ flex: 1, borderRadius: 5, borderWidth: 2 }}>
            <UserCheckList
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
                    title={i18next.t("Change to Police")}
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
                    title={i18next.t("Change to Thief (Alive)")}
                    onPress={() => {
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
                    title={i18next.t("Change to Thief (Arrested)")}
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

                      if (isInValidRoleCount()) {
                        Alert.alert(
                          i18next.t("Error"),
                          i18next.t(
                            "At least one thief (alive) and one police officer are required.",
                          ),
                        );
                        return;
                      }

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
              <Text style={{ fontSize: 30 }}>
                {i18next.t("Participation QR")}
              </Text>
              <Text style={{ marginBottom: 30 }}>
                {i18next.t("Have friends scan to join the game")}
              </Text>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <QRCode size={150} value={tagGameStore.getTagGame().getId()} />
              </View>
            </>
          ) : (
            <View style={{ height: 100 }}>
              <Text style={{ fontSize: 15 }}>
                {i18next.t("To display game group QR, please start the game")}
              </Text>
            </View>
          )}
          <Button
            title={i18next.t("Close")}
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

export default inject("_userStore", "_tagGameStore")(observer(TeamEditScreen));
