import { SafeAreaView } from "react-native-safe-area-context";

import { inject, observer } from "mobx-react";
import { router } from "expo-router";
import { View } from "react-native";
import TagGameStore from "@/stores/TagGameStore";
import UserStore from "@/stores/UserStore";
import { Button } from "@rneui/themed";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function SettingScreen({ _userStore, _tagGameStore }: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  return (
    <View
      style={{ height: "100%", alignItems: "center", backgroundColor: "white" }}
    >
      <View style={{ gap: 100, height: "80%" }}>
        <Button
          color={
            tagGameStore.getTagGame().getIsSetValidAreaDone()
              ? "success"
              : "error"
          }
          title="ゲーム範囲設定"
          onPress={() => {
            router.push("/ValidAreaScreen");
          }}
        ></Button>
        <Button
          color={
            tagGameStore.getTagGame().getIsSetPrisonAreaDone()
              ? "success"
              : "error"
          }
          title="監獄エリア設定"
          onPress={() => {
            router.push("/PrisonAreaScreen");
          }}
        ></Button>
        <Button
          color={"error"}
          title="チーム設定"
          onPress={() => {
            router.push("/TeamEditScreen");
          }}
        ></Button>
      </View>
    </View>
  );
}

export default inject("_userStore", "_tagGameStore")(observer(SettingScreen));
