import { useState, useEffect } from "react";
import i18next from "i18next";

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
        i18next.t("Thief List Explanation"),
        i18next.t(
          "On this screen, you can check whether each thief is on the run or arrested.",
        ),
        [
          {
            onPress: () => {
              Alert.alert(
                i18next.t("Tutorial Complete"),
                i18next.t(
                  "This completes the tutorial.\nNow let's move to the settings screen and configure 'Valid Game Area' through 'Time Limit' settings to start the game🎉",
                ),
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
            {i18next.t("Thief (Arrested) {{count}} people", {
              count: tagGameStore.getTagGame().getRejectUsers().length,
            })}
          </Text>
          <View style={{ flex: 1, borderRadius: 5, borderWidth: 2 }}>
            <UserList userRecords={rejectUsersForList} />
          </View>
        </View>
        <View style={{ flex: 1, margin: 10 }}>
          <Text style={{ textAlign: "center", fontSize: 20 }}>
            {i18next.t("Thief (Alive) {{count}} people", {
              count: tagGameStore.getTagGame().getLiveUsers().length,
            })}
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
