import React, { useState } from "react";
import { View, Alert } from "react-native";
import TagGameStore from "@/stores/TagGameStore";
import AbilitySelecter from "./AbilitySelecter";

interface UseAbilitySelecterProps {
  tagGameStore: TagGameStore;
  role: "police" | "thief";
  onAbilityExecuted?: (abilityKey: string) => void;
}

const UseAbilitySelecter: React.FC<UseAbilitySelecterProps> = ({ tagGameStore, role, onAbilityExecuted }) => {
  const [usedAbilities, setUsedAbilities] = useState<string[]>(
    tagGameStore.currentUserUsedAbilities[role] || []
  );

  const handleExec = async (key: string) => {
    if (usedAbilities.includes(key)) {
      Alert.alert("このアビリティは既に使用済みです");
      return;
    }
    const ability = (role === "police" ? tagGameStore.policeAbilities : tagGameStore.thiefAbilities)[key];
    if (!ability || !ability.enable) return;
    try {
      await ability.method();
      const next = [...usedAbilities, key];
      setUsedAbilities(next);
      tagGameStore.currentUserUsedAbilities[role] = next;
      if (onAbilityExecuted) onAbilityExecuted(key);
    } catch (e) {
      Alert.alert("アビリティ実行エラー", String(e));
    }
  };

  return (
    <View>
      <AbilitySelecter
        tagGameStore={tagGameStore}
        role={role}
        selectedAbilities={usedAbilities}
        onSelect={handleExec}
      />
    </View>
  );
};

export default UseAbilitySelecter;
