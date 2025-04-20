import { inject, observer } from "mobx-react";
import { router } from "expo-router";
import { View } from "react-native";

import TagGameStore from "@/stores/TagGameStore";
import UserStore from "@/stores/UserStore";
import { putTagGames } from "@/utils/APIs";
import { Button } from "@rneui/themed";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function SettingScreen({ _tagGameStore }: Props) {
  const tagGameStore = _tagGameStore!;

  const gameStart = () => {
    tagGameStore.getTagGame().setIsGameStarted(true);
    const tagGame = tagGameStore.getTagGame().toObject();
    putTagGames(tagGame);
  };

  const gameCancel = () => {
    tagGameStore.getTagGame().setIsGameStarted(false);
    const tagGame = tagGameStore.getTagGame().toObject();
    putTagGames(tagGame);
  };

  const canGameStart = () => {
    return (
      tagGameStore.getTagGame().getIsSetValidAreaDone() &&
      tagGameStore.getTagGame().getIsSetPrisonAreaDone() &&
      tagGameStore.getIsEditTeams() &&
      !!tagGameStore.getTagGame().getGameTimeLimit()
    );
  };

  return (
    <View
      style={{ height: "100%", alignItems: "center", backgroundColor: "white" }}
    >
      <View style={{ gap: 100, height: "80%" }}>
        <Button
          color={
            tagGameStore.getTagGame().getIsSetValidAreaDone()
              ? "success"
              : "error"
          }
          title="ゲーム範囲設定"
          onPress={() => {
            router.push("/ValidAreaScreen");
          }}
        ></Button>
        <Button
          color={
            tagGameStore.getTagGame().getIsSetPrisonAreaDone()
              ? "success"
              : "error"
          }
          title="監獄エリア設定"
          onPress={() => {
            router.push("/PrisonAreaScreen");
          }}
        ></Button>
        <Button
          color={tagGameStore.getIsEditTeams() ? "success" : "error"}
          title="チーム設定"
          onPress={() => {
            router.push("/TeamEditScreen");
          }}
        ></Button>
        <Button
          color={
            tagGameStore.getTagGame().getGameTimeLimit() ? "success" : "error"
          }
          title="タイムリミット設定"
          onPress={() => {
            router.push("/GameTimeScreen");
          }}
        ></Button>
      </View>
      {tagGameStore.getTagGame().getIsGameStarted() === true ? (
        <Button
          title={"ゲーム中止"}
          color={"error"}
          onPress={() => {
            gameCancel();
          }}
        />
      ) : (
        <Button
          title={"ゲームスタート"}
          color={"primary"}
          disabled={!canGameStart()}
          onPress={() => {
            gameStart();
          }}
        />
      )}
    </View>
  );
}

export default inject("_userStore", "_tagGameStore")(observer(SettingScreen));
