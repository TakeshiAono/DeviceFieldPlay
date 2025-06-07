import { useState, useEffect } from "react";

import UserStore from "@/stores/UserStore";
import { inject, observer } from "mobx-react";
import { Alert, Text, View } from "react-native";
import TagGameStore from "@/stores/TagGameStore";
import _ from "lodash";
import { router } from "expo-router";

import UserList, { UserListItem } from "@/components/UserList";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function ThiefListScreen({ _tagGameStore }: Props) {
  const tagGameStore = _tagGameStore!;

  const [liveUsersForList, setLiveUsersForList] = useState<UserListItem[]>(
    tagGameStore
      .getTagGame()
      .getLiveUsers()
      .map((user) => {
        return { id: user.getId(), name: user.getName() };
      }),
  );
  const [rejectUsersForList, setRejectUsersForList] = useState<UserListItem[]>(
    tagGameStore
      .getTagGame()
      .getRejectUsers()
      .map((user) => {
        return { id: user.getId(), name: user.getName() };
      }),
  );

  useEffect(() => {
    if (tagGameStore.getShouldShowGameExplanation()) {
      tagGameStore.setShouldShowGameExplanation(false);

      Alert.alert(
        "泥棒リストの説明",
        "この画面では各泥棒が逃亡中か逮捕中を確認することができます。",
        [
          {
            onPress: () => {
              Alert.alert(
                "チュートリアル終了",
                "これでチュートリアル終了です。\nそれでは設定画面に移動して「ゲーム有効エリア」〜「タイムリミット」の設定を行い、ゲームを始めましょう🎉",
              );
            },
          },
        ],
      );
    }
  }, []);

  useEffect(() => {
    setLiveUsersForList(
      tagGameStore
        .getTagGame()
        .getLiveUsers()
        .map((user) => {
          return { id: user.getId(), name: user.getName() };
        }),
    );
    setRejectUsersForList(
      tagGameStore
        .getTagGame()
        .getRejectUsers()
        .map((user) => {
          return { id: user.getId(), name: user.getName() };
        }),
    );
  }, [
    tagGameStore.getTagGame().getLiveUsers(),
    tagGameStore.getTagGame().getRejectUsers(),
  ]);

  return (
    <SafeAreaView>
      <View style={{ backgroundColor: "white", height: "100%" }}>
        <View style={{ flex: 1, margin: 10 }}>
          <Text style={{ textAlign: "center", fontSize: 20 }}>
            生存(逮捕) {tagGameStore.getTagGame().getRejectUsers().length}人
          </Text>
          <View style={{ flex: 1, borderRadius: 5, borderWidth: 2 }}>
            <UserList userRecords={rejectUsersForList} />
          </View>
        </View>
        <View style={{ flex: 1, margin: 10 }}>
          <Text style={{ textAlign: "center", fontSize: 20 }}>
            泥棒(生存) {tagGameStore.getTagGame().getLiveUsers().length}人
          </Text>
          <View style={{ flex: 1, borderRadius: 5, borderWidth: 2 }}>
            <UserList userRecords={liveUsersForList} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default inject("_userStore", "_tagGameStore")(observer(ThiefListScreen));
