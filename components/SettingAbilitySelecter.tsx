import AbilitySelecter from "@/components/AbilitySelecter";
import { observer } from "mobx-react";
import { View, Text } from "react-native";

// 設定画面用アビリティセレクター
const SettingAbilitySelecter = observer(({ tagGameStore, userType, selectedAbilities, onSelect }) => {
  const abilities = userType === "police" ? tagGameStore.policeAbilities : tagGameStore.thiefAbilities;
  return (
    <View>
      <Text style={{ fontWeight: "bold", fontSize: 16 }}>{userType === "police" ? "警察アビリティ" : "泥棒アビリティ"}</Text>
      <AbilitySelecter
        abilities={abilities}
        selectedAbilities={selectedAbilities}
        onSelect={onSelect}
        disabled={false}
      />
    </View>
  );
});

export default SettingAbilitySelecter;
