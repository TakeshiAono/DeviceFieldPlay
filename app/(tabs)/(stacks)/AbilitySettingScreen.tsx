import SettingAbilitySelecter from "@/components/SettingAbilitySelecter";
import { observer, inject } from "mobx-react";
import { View, Text } from "react-native";

const AbilitySettingScreen = inject("_tagGameStore")(
  observer(({ _tagGameStore }) => {
    // 仮のstate（実装時はstore管理）
    const [policeSelected, setPoliceSelected] = React.useState([]);
    const [thiefSelected, setThiefSelected] = React.useState([]);
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>アビリティ設定</Text>
        <SettingAbilitySelecter
          tagGameStore={_tagGameStore}
          userType="police"
          selectedAbilities={policeSelected}
          onSelect={(name) => setPoliceSelected((prev) => [...prev, name])}
        />
        <SettingAbilitySelecter
          tagGameStore={_tagGameStore}
          userType="thief"
          selectedAbilities={thiefSelected}
          onSelect={(name) => setThiefSelected((prev) => [...prev, name])}
        />
      </View>
    );
  })
);

export default AbilitySettingScreen;
