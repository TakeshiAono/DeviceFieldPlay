import { useState, useRef } from "react";
import * as Crypto from "expo-crypto";

import UserStore from "@/stores/UserStore";
import { inject, observer } from "mobx-react";
import { Pressable, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Button } from "@rneui/themed";
import { joinUser, putDevices, putTagGames, putUser } from "@/utils/APIs";
import TagGameStore from "@/stores/TagGameStore";
import _ from "lodash";
import { ValidAreaEditMap } from "@/components/ValidAreaEditMap";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function ValidAreaScreen({ _userStore, _tagGameStore }: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;
  // const [isSetDoneArea, setIsSetDoneArea] = useState(false);

  const isGameStartDone = useRef(false);

  const isGameMaster = () => {
    return userStore.isCurrentUserGameMaster(tagGameStore.getTagGame());
  };

  const storeGameStartSetting = async (gameId: string) => {
    try {
      await joinUser(gameId, userStore.getCurrentUser().getDeviceId());
      await putUser(gameId, userStore.getCurrentUser());
      if (!isGameStartDone.current)
        await putDevices(gameId, userStore.getCurrentUser().getDeviceId());

      console.log("通知設定をdynamoへセット完了");
      isGameStartDone.current = true;
    } catch (error) {
      console.log(error);
    }
  };

  const resetValidArea = () => {
    tagGameStore.putValidArea([]);
  };

  return (
    // NOTE: tab分の高さが7%なので93%に設定している
    <View style={{ backgroundColor: "blue", height: "93%", width: "100%" }}>
      <ValidAreaEditMap
        points={tagGameStore.getTagGame().getValidAreas()}
        setPoints={(points) => {
          tagGameStore.putValidArea(points);
        }}
      />
      <View style={{ flexDirection: "row", width: "100%" }}>
        <View style={{ flex: 1, margin: 5 }}>
          <Button
            type="solid"
            color={
              !!tagGameStore.getTagGame().getIsSetValidAreaDone()
                ? "success"
                : "primary"
            }
            disabled={
              !(isGameMaster() || !tagGameStore.getTagGame().isSetGame())
            }
            onPress={async () => {
              const tagGame = tagGameStore.getTagGame();
              if (_.isEmpty(tagGame.getId())) {
                tagGame.setId(Crypto.randomUUID());
              }
              if (_.isEmpty(tagGame.getGameMasterDeviceId())) {
                tagGame.setGameMasterDeviceId(
                  userStore.getCurrentUser().getDeviceId(),
                );
              }

              await putTagGames(tagGame.toObject());
              // setIsSetDoneArea(true);
              tagGameStore.setIsSetValidAreaDone(true);

              if (!userStore.getCurrentUser().getDeviceId()) return;
              await storeGameStartSetting(tagGame.getId());
            }}
          >
            <IconSymbol size={28} name={"mappin.and.ellipse"} color={"white"} />
            {!!tagGameStore.getTagGame().getIsSetValidAreaDone()
              ? "エリア更新"
              : "エリア登録"}
          </Button>
        </View>
        <View style={{ flex: 1, margin: 5 }}>
          <Button
            type="solid"
            onPress={() => {
              resetValidArea();
              tagGameStore.setIsSetValidAreaDone(false);
            }}
            disabled={
              !(isGameMaster() || !tagGameStore.getTagGame().isSetGame())
            }
          >
            <IconSymbol
              size={28}
              name={"arrow.counterclockwise"}
              color={"white"}
            />
            エリア削除
          </Button>
        </View>
      </View>
    </View>
  );
}

export default inject("_userStore", "_tagGameStore")(observer(ValidAreaScreen));
