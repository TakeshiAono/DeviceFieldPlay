import TagGameStore, { ScreenNames } from "@/stores/TagGameStore";
import { inject, observer } from "mobx-react";
import { View } from "react-native";
import { Text, TouchableOpacity } from "react-native";
import { useCopilot } from "react-native-copilot";

interface Props {
  _tagGameStore?: TagGameStore;
  targetScreenName: string;
  startCopilotStepName: string;
}

const ExplanationPanel = ({
  _tagGameStore,
  targetScreenName,
  startCopilotStepName,
}: Props) => {
  const tagGameStore = _tagGameStore!;

  const { start } = useCopilot();

  // TODO: 親子コンポーネントからsetterを渡して値を更新すると、getterを使っているコンポーネントがリアクティブに変更しないという現象あるため
  // 親コンポーネントから文字列を渡して、本コンポーネントでsetしている。
  const updateTargetExplanationFlag = () => {
    switch (targetScreenName) {
      case ScreenNames.SettingScreen:
        return tagGameStore.setExplainedSettingScreen(true);
      case ScreenNames.GameTimeScreen:
        return tagGameStore.setExplainedGameTimeScreen(true);
      case ScreenNames.PrisonAreaScreen:
        return tagGameStore.setExplainedPrisonAreaScreen(true);
      case ScreenNames.ShowMapScreen:
        return tagGameStore.setExplainedShowMapScreen(true);
      case ScreenNames.TeamEditScreen:
        return tagGameStore.setExplainedTeamEditScreen(true);
      case ScreenNames.ValidAreaScreen:
        return tagGameStore.setExplainedValidAreaScreen(true);
      default:
        return;
    }
  };

  return (
    <View
      style={{
        position: "absolute",
        height: "100%",
        width: "100%",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 10,
      }}
    >
      <TouchableOpacity
        style={{
          width: 150,
          height: 100,
          backgroundColor: "rgb(10, 100, 250)",
          justifyContent: "center",
          alignItems: "center",
          padding: 10,
          borderRadius: 5,
          opacity: 0.9,
          zIndex: 10,
        }}
        onPress={() => {
          updateTargetExplanationFlag();
          start(startCopilotStepName);
        }}
      >
        <View>
          <Text style={{ color: "white", fontSize: 20 }}>説明を聞く</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          width: 150,
          height: 100,
          backgroundColor: "rgb(234, 234, 70)",
          justifyContent: "center",
          alignItems: "center",
          padding: 10,
          borderRadius: 5,
          opacity: 0.9,
          zIndex: 10,
        }}
        onPress={() => {
          updateTargetExplanationFlag();
        }}
      >
        <View>
          <Text style={{ color: "white", fontSize: 20 }}>
            このページの説明は不要
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          width: 150,
          height: 100,
          backgroundColor: "rgb(234, 70, 95)",
          justifyContent: "center",
          alignItems: "center",
          padding: 10,
          borderRadius: 5,
          opacity: 0.9,
          zIndex: 10,
        }}
        onPress={() => {
          tagGameStore.setShouldShowGameExplanation(false);
        }}
      >
        <View>
          <Text style={{ color: "white", fontSize: 20 }}>
            全ての説明をスキップ
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default inject("_tagGameStore")(observer(ExplanationPanel));
