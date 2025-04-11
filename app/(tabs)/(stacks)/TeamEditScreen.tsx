import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { useCameraPermissions } from "expo-camera";
import * as Notifications from "expo-notifications";

import UserStore from "@/stores/UserStore";
import { inject, observer } from "mobx-react";
import { useRouter } from "expo-router";
import { Button, Text, TouchableOpacity, View } from "react-native";
import { UserTypeForList } from "@/components/UserList";
import TagGameStore from "@/stores/TagGameStore";
import UserList from "@/components/UserList";
import _ from "lodash";

import { putTagGames } from "@/utils/APIs";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function SettingScreen({ _userStore, _tagGameStore }: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  const formatForListData = (users: string[]) => {
    return users.map((user, index) => ({
      id: String(index),
      name: user,
      checked: false,
    }));
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
  >(formatForListData(tagGameStore.getTagGame().getRejectUsers() ?? []));

  const deviceId = useRef("");

  const router = useRouter();

  Notifications.getDevicePushTokenAsync().then(({ data }) => {
    console.log("deviceId:", data);
    deviceId.current = data;
    userStore.getCurrentUser().setDeviceId(data);
  });

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
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View style={{ flex: 1, margin: 10 }}>
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
                  width: "80%",
                }}
              >
                <View style={{ width: "50%" }}>
                  <Button
                    title="追放"
                    onPress={() => {
                      tagGameStore.kickOutUsers(
                        selectedUsers.map((user) => user.name),
                      );
                      setSelectedUsers([]);
                    }}
                  />
                </View>
                <View style={{ width: "50%", marginLeft: 10 }}>
                  <Button
                    title="警察へ変更"
                    onPress={() => {
                      tagGameStore.changeToPolice(
                        selectedUsers.map((user) => user.name),
                      );
                      setSelectedUsers([]);
                    }}
                  />
                </View>
              </View>
              <View
                style={{
                  marginHorizontal: "auto",
                  flexDirection: "row",
                  width: "80%",
                  marginTop: 10,
                }}
              >
                <View style={{ width: "50%" }}>
                  <Button
                    title="泥棒(生存)に変更"
                    onPress={() => {
                      tagGameStore.changeToLiveThief(
                        selectedUsers.map((user) => user.name),
                      );
                      setSelectedUsers([]);
                    }}
                  />
                </View>
                <View style={{ width: "50%", marginLeft: 10 }}>
                  <Button
                    title="泥棒(脱落)に変更"
                    onPress={() => {
                      tagGameStore.changeToRejectThief(
                        selectedUsers.map((user) => user.name),
                      );
                      setSelectedUsers([]);
                    }}
                  />
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedUsers([]);
                // なぜエラーが発生してしまう？
                // TODO: 先にエリアを設定しないとidが設定されず、dynamo not keyエラーが発生してしまう
                // idはマップコンポーネントではなくて設定画面でゲーム生成ボタンなどの押下時に格納するよう変更する
                putTagGames(tagGameStore.getTagGame().toObject());
              }}
              style={{
                backgroundColor: "red",
                paddingHorizontal: 24,
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
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
  );
}

export default inject("_userStore", "_tagGameStore")(observer(SettingScreen));
