import UseAbilitySelecter from "@/components/UseAbilitySelecter";
import { observer, inject } from "mobx-react";
import { View, Text, Button } from "react-native";
import { router } from "expo-router";

const AbilityScreen = inject("_tagGameStore", "_userStore")(
  observer(({ _tagGameStore, _userStore }) => {
    // 仮のstate（実装時はstore管理）
    const [usedAbilities, setUsedAbilities] = React.useState([]);
    const userType = _tagGameStore.isCurrentUserPolice(_userStore.getCurrentUser()) ? "police" : "thief";
    const handleExecAbility = (name) => {
      if (!usedAbilities.includes(name)) {
        setUsedAbilities((prev) => [...prev, name]);
        // 実際はここでアビリティ実行処理
        router.replace("/MapScreen");
      }
    };
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>アビリティ使用</Text>
        <UseAbilitySelecter
          tagGameStore={_tagGameStore}
          userType={userType}
          usedAbilities={usedAbilities}
          onExecAbility={handleExecAbility}
        />
      </View>
    );
  })
);

export default AbilityScreen;
