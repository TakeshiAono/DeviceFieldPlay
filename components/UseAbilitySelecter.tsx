import AbilitySelecter from "@/components/AbilitySelecter";
import { observer } from "mobx-react";
import { View, Text, Button } from "react-native";

// アビリティ使用画面用セレクター
const UseAbilitySelecter = observer(({ tagGameStore, userType, usedAbilities, onExecAbility }) => {
  const abilities = userType === "police" ? tagGameStore.policeAbilities : tagGameStore.thiefAbilities;
  return (
    <View>
      <Text style={{ fontWeight: "bold", fontSize: 16 }}>{userType === "police" ? "警察アビリティ" : "泥棒アビリティ"}</Text>
      <AbilitySelecter
        abilities={abilities}
        selectedAbilities={usedAbilities}
        onSelect={onExecAbility}
        disabled={false}
      />
    </View>
  );
});

export default UseAbilitySelecter;
