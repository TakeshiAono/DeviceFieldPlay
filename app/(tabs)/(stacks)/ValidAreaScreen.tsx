import UserStore from "@/stores/UserStore";
import { inject, observer } from "mobx-react";
import { Alert, View } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Button } from "@rneui/themed";
import { putTagGames } from "@/utils/APIs";
import TagGameStore from "@/stores/TagGameStore";
import _ from "lodash";
import ValidAreaEditMap from "@/components/ValidAreaEditMap";
import { router } from "expo-router";
import { useEffect } from "react";
import i18next from "i18next";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function ValidAreaScreen({ _userStore, _tagGameStore }: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  useEffect(() => {
    if (tagGameStore.getShouldShowGameExplanation()) {
      Alert.alert(
        i18next.t("Area Setting Method"),
        i18next.t("You can set the area by tapping 3 points on the map. Press 'Register Area' to confirm"),
      );
    }
  }, []);

  const isGameMaster = () => {
    return userStore.isCurrentUserGameMaster(tagGameStore.getTagGame());
  };

  const resetValidArea = () => {
    tagGameStore.putValidArea([]);
  };

  return (
    <View style={{ flex: 1, width: "100%" }}>
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
              if (tagGameStore.getShouldShowGameExplanation()) {
                router.replace("/PrisonAreaScreen");
                return;
              }

              if (tagGameStore.getTagGame().getValidAreas().length < 3) {
                Alert.alert(i18next.t("Error"), i18next.t("Please set 3 or more points for valid area."));
                return;
              }

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
              ? i18next.t("Update Area")
              : i18next.t("Register Area")}
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
            {i18next.t("Delete Area")}
          </Button>
        </View>
      </View>
    </View>
  );
}

export default inject("_userStore", "_tagGameStore")(observer(ValidAreaScreen));
