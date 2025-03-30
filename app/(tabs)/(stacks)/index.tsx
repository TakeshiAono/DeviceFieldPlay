import { SafeAreaView } from "react-native-safe-area-context";

import { inject, observer } from "mobx-react";
import { router } from "expo-router";
import { Button, View } from "react-native";

function SettingScreen() {
  return (
    <SafeAreaView>
      <View style={{ height: "100%", alignItems: "center" }}>
        <View style={{ gap: 100, height: "80%" }}>
          <Button
            color={"red"}
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

export default inject("_userStore")(observer(SettingScreen));
