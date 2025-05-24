import React, { useState } from "react";
import { View } from "react-native";
import TagGameStore from "@/stores/TagGameStore";
import AbilitySelecter from "./AbilitySelecter";

interface SettingAbilitySelecterProps {
  tagGameStore: TagGameStore;
  onChange: (role: "police" | "thief", selected: string[]) => void;
}

const SettingAbilitySelecter: React.FC<SettingAbilitySelecterProps> = ({ tagGameStore, onChange }) => {
  const [policeSelected, setPoliceSelected] = useState<string[]>([]);
  const [thiefSelected, setThiefSelected] = useState<string[]>([]);

  const handleSelect = (role: "police" | "thief", key: string) => {
    if (role === "police") {
      const next = policeSelected.includes(key)
        ? policeSelected.filter((k) => k !== key)
        : [...policeSelected, key];
      setPoliceSelected(next);
      onChange("police", next);
    } else {
      const next = thiefSelected.includes(key)
        ? thiefSelected.filter((k) => k !== key)
        : [...thiefSelected, key];
      setThiefSelected(next);
      onChange("thief", next);
    }
  };

  return (
    <View>
      <AbilitySelecter
        tagGameStore={tagGameStore}
        role="police"
        selectedAbilities={policeSelected}
        onSelect={(key) => handleSelect("police", key)}
      />
      <View style={{ height: 20 }} />
      <AbilitySelecter
        tagGameStore={tagGameStore}
        role="thief"
        selectedAbilities={thiefSelected}
        onSelect={(key) => handleSelect("thief", key)}
      />
    </View>
  );
};

export default SettingAbilitySelecter;
