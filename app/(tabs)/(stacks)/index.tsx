import { SafeAreaView } from "react-native-safe-area-context";

import { inject, observer } from "mobx-react";
import { router } from "expo-router";
import { Button, View } from "react-native";
import TagGameStore from "@/stores/TagGameStore";
import UserStore from "@/stores/UserStore";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function SettingScreen({ _userStore, _tagGameStore }: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  return (
    <SafeAreaView>
      <View style={{ height: "100%", alignItems: "center" }}>
        <View style={{ gap: 100, height: "80%" }}>
          <Button
            color={
              tagGameStore.getTagGame().getIsSetValidAreaDone()
                ? "yellowgreen"
                : "gray"
            }
            title="ゲーム範囲設定"
            onPress={() => {
              router.push("/ValidAreaScreen");
            }}
          ></Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default inject("_userStore", "_tagGameStore")(observer(SettingScreen));
