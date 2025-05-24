import React from "react";
import { View, Text } from "react-native";
import { inject, observer } from "mobx-react";
import UseAbilitySelecter from "@/components/UseAbilitySelecter";
import TagGameStore from "@/stores/TagGameStore";
import UserStore from "@/stores/UserStore";
import { router } from "expo-router";

interface Props {
  _tagGameStore?: TagGameStore;
  _userStore?: UserStore;
}

const AbilityScreen: React.FC<Props> = ({ _tagGameStore, _userStore }) => {
  const tagGameStore = _tagGameStore!;
  const userStore = _userStore!;

  // ユーザーの役割を取得
  const role: "police" | "thief" =
    tagGameStore.isCurrentUserPolice(userStore.getCurrentUser())
      ? "police"
      : "thief";

  const handleAbilityExecuted = () => {
    // アビリティ実行後MapScreenへ遷移
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>アビリティ使用</Text>
      <UseAbilitySelecter
        tagGameStore={tagGameStore}
        role={role}
        onAbilityExecuted={handleAbilityExecuted}
      />
    </View>
  );
};

export default inject("_tagGameStore", "_userStore")(observer(AbilityScreen));
