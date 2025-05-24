import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { observer } from "mobx-react";
import TagGameStore from "@/stores/TagGameStore";

interface AbilitySelecterProps {
  tagGameStore: TagGameStore;
  role: "police" | "thief";
  selectedAbilities: string[];
  onSelect: (abilityKey: string) => void;
}

const AbilitySelecter: React.FC<AbilitySelecterProps> = observer(
  ({ tagGameStore, role, selectedAbilities, onSelect }) => {
    const abilities =
      role === "police"
        ? tagGameStore.policeAbilities
        : tagGameStore.thiefAbilities;

    return (
      <View>
        <Text style={{ fontWeight: "bold", fontSize: 18 }}>
          {role === "police" ? "警察用アビリティ" : "泥棒用アビリティ"}
        </Text>
        {Object.entries(abilities).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={{
              padding: 10,
              marginVertical: 5,
              backgroundColor: selectedAbilities.includes(key)
                ? "#4caf50"
                : "#eee",
              borderRadius: 5,
            }}
            disabled={!value.enable}
            onPress={() => onSelect(key)}
          >
            <Text style={{ color: value.enable ? "#000" : "#aaa" }}>
              {key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
);

export default AbilitySelecter;
