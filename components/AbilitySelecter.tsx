import { observer } from "mobx-react";
import { View, Text, Button } from "react-native";

// アビリティ選択用コンポーネント
const AbilitySelecter = observer(({ abilities, selectedAbilities, onSelect, disabled }) => {
  return (
    <View>
      {Object.entries(abilities).map(([name, { enable }]) => (
        <View key={name} style={{ flexDirection: "row", alignItems: "center", marginVertical: 4 }}>
          <Button
            title={name}
            onPress={() => onSelect(name)}
            disabled={disabled || !enable || selectedAbilities.includes(name)}
          />
          <Text style={{ marginLeft: 8 }}>{enable ? "有効" : "無効"}</Text>
        </View>
      ))}
    </View>
  );
});

export default AbilitySelecter;
