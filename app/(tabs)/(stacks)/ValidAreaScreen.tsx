import UserStore from "@/stores/UserStore";
import { inject, observer } from "mobx-react";
import { View } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Button } from "@rneui/themed";
import { putTagGames } from "@/utils/APIs";
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

  const isGameMaster = () => {
    return userStore.isCurrentUserGameMaster(tagGameStore.getTagGame());
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
              tagGameStore.getTagGame().getIsSetValidAreaDone()
                ? "success"
                : "primary"
            }
            disabled={
              !(isGameMaster() || !tagGameStore.getTagGame().isSetGame())
            }
            onPress={async () => {
              const tagGame = tagGameStore.getTagGame();
              if (_.isEmpty(tagGame.getGameMasterId())) {
                tagGame.setGameMasterId(userStore.getCurrentUser().getId());
              }

              await putTagGames(tagGame.toObject());
              // setIsSetDoneArea(true);
              tagGameStore.setIsSetValidAreaDone(true);
            }}
          >
            <IconSymbol size={28} name={"mappin.and.ellipse"} color={"white"} />
            {tagGameStore.getTagGame().getIsSetValidAreaDone()
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
