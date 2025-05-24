import React from "react";
import { View, Text } from "react-native";
import { inject, observer } from "mobx-react";
import SettingAbilitySelecter from "@/components/SettingAbilitySelecter";
import TagGameStore from "@/stores/TagGameStore";

interface Props {
  _tagGameStore?: TagGameStore;
}

const AbilitySettingScreen: React.FC<Props> = ({ _tagGameStore }) => {
  const tagGameStore = _tagGameStore!;

  const handleChange = (role: "police" | "thief", selected: string[]) => {
    // 必要に応じてstoreに保存する処理を追加
    // 例: tagGameStore.setEnabledAbilities(role, selected)
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>アビリティ設定</Text>
      <SettingAbilitySelecter tagGameStore={tagGameStore} onChange={handleChange} />
    </View>
  );
};

export default inject("_tagGameStore")(observer(AbilitySettingScreen));
