import { inject, observer } from "mobx-react";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View, Alert } from "react-native";
import ReactNativeModal from "react-native-modal";
import i18next from "i18next";

import TagGameStore from "@/stores/TagGameStore";
import UserStore from "@/stores/UserStore";
import { fetchTagGames, joinUser, putTagGames, putUser } from "@/utils/APIs";
import { Button } from "@rneui/themed";
import { useEffect, useRef, useState } from "react";
import { CameraView } from "expo-camera";
import TagGameModel from "@/models/TagGameModel";
import { CopilotStep } from "react-native-copilot";
import { Colors } from "@/constants/Colors";
import { IconSymbol } from "@/components/ui/IconSymbol";
import useCopilotHook from "@/hooks/useCopilotHook";
import { removeUserFromGame } from "@/utils/APIs";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function SettingScreen({ _userStore, _tagGameStore }: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  const [cameraVisible, setCameraVisible] = useState(false);

  const firstScan = useRef(true);

  const [setIsStart, CopilotTouchableOpacity, ..._other] = useCopilotHook(
    userStore.isCurrentUserGameMaster(tagGameStore.getTagGame())
      ? "validGameArea"
      : "gameJoinCamera",
    userStore.isCurrentUserGameMaster(tagGameStore.getTagGame())
      ? ["validGameArea", "prisonArea", "teamEdit", "gameTime", "gameStart"]
      : ["gameJoinCamera"],
    userStore.isCurrentUserGameMaster(tagGameStore.getTagGame())
      ? "/ValidAreaScreen"
      : null,
  );

  useEffect(() => {
    if (tagGameStore.getShouldShowGameExplanation()) {
      setTimeout(() => {
        setIsStart(true);
      }, 500);
    }
  }, []);

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

  // ゲームマスター以外の人(子)がゲーム情報をstoreにセットするための処理
  const setDataSettings = async ({ data: gameId }: { data: string }) => {
    if (!tagGameStore.belongingGameGroup(gameId)) firstScan.current = true;

    // NOTE: カメラモーダルを閉じた際にtrueに戻します。
    // NOTE: QRが画面上にある限り連続スキャンしてしまうので最初のスキャン以外は早期リターンしている
    if (!firstScan.current || !userStore.getCurrentUser().getId()) return;

    firstScan.current = false;
    console.log("ScanData: ", gameId);
    setCameraVisible(false);
    tagGameStore.getTagGame().setId(gameId);
    await putUser(gameId, userStore.getCurrentUser());

    await joinUser(gameId, userStore.getCurrentUser().getId());

    const fetchedTagGame = await fetchTagGames(gameId);
    const tagGame = new TagGameModel(fetchedTagGame);
    tagGameStore.putTagGame(tagGame);
  };

  const canGameStart = () => {
    return (
      tagGameStore.getTagGame().getIsSetValidAreaDone() &&
      tagGameStore.getTagGame().getIsSetPrisonAreaDone() &&
      tagGameStore.getIsEditTeams() &&
      !!tagGameStore.getTagGame().getGameTimeLimit()
    );
  };

  const validGameAreaButtonExplanation = i18next.t(
    "Navigate to the screen to edit the valid area in the game. Thieves who leave the game area will be forcibly arrested.",
  );
  const prisonAreaButtonExplanation = i18next.t(
    "Navigate to the screen to edit the prison area to house thieves. Set the area to house captured thieves.",
  );
  const teamEditButtonExplanation = i18next.t(
    "Navigate to the screen to edit the roles of police and thieves.",
  );
  const gameTimeButtonExplanation = i18next.t(
    "Navigate to the screen to edit the game end time.",
  );
  const gameStartButtonExplanation = i18next.t(
    "After all settings are completed, the button will become pressable and you can start the game.",
  );
  const gameJoinCameraButtonExplanation = i18next.t(
    "You can join the game hosted by the game master by reading the game master's QR code.",
  );

  return (
    <View
      style={{
        height: "100%",
        alignItems: "center",
        backgroundColor: "white",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          flex: 1,
          height: "100%",
          justifyContent: "space-around",
        }}
      >
        {userStore.isCurrentUserGameMaster(tagGameStore.getTagGame()) ? (
          <>
            <CopilotStep
              text={validGameAreaButtonExplanation}
              order={4}
              name="validGameArea"
            >
              <CopilotTouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: tagGameStore
                      .getTagGame()
                      .getIsSetValidAreaDone()
                      ? Colors.primary
                      : Colors.warning,
                  },
                ]}
                onPress={() => {
                  router.push("/ValidAreaScreen");
                }}
              >
                <Text>{i18next.t("Valid Game Area Setting")}</Text>
              </CopilotTouchableOpacity>
            </CopilotStep>
            <CopilotStep
              text={prisonAreaButtonExplanation}
              order={5}
              name="prisonArea"
            >
              <CopilotTouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: tagGameStore
                      .getTagGame()
                      .getIsSetPrisonAreaDone()
                      ? Colors.primary
                      : Colors.warning,
                  },
                ]}
                onPress={() => {
                  router.push("/PrisonAreaScreen");
                }}
              >
                <Text>{i18next.t("Prison Area Setting")}</Text>
              </CopilotTouchableOpacity>
            </CopilotStep>
            <CopilotStep
              text={teamEditButtonExplanation}
              order={6}
              name="teamEdit"
            >
              <CopilotTouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: tagGameStore.getIsEditTeams()
                      ? Colors.primary
                      : Colors.warning,
                  },
                ]}
                onPress={() => {
                  router.push("/TeamEditScreen");
                }}
              >
                <Text>{i18next.t("Team Settings")}</Text>
              </CopilotTouchableOpacity>
            </CopilotStep>
            <CopilotStep
              text={gameTimeButtonExplanation}
              order={7}
              name="gameTime"
            >
              <CopilotTouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: tagGameStore
                      .getTagGame()
                      .getGameTimeLimit()
                      ? Colors.primary
                      : Colors.warning,
                  },
                ]}
                onPress={() => {
                  router.push("/GameTimeScreen");
                }}
              >
                <Text>{i18next.t("Time Limit Settings")}</Text>
              </CopilotTouchableOpacity>
            </CopilotStep>
            {tagGameStore.getTagGame().getIsGameStarted() === true ? (
              <Button
                title={i18next.t("Cancel Game")}
                color={"error"}
                onPress={() => {
                  gameCancel();
                }}
              />
            ) : (
              <CopilotStep
                text={gameStartButtonExplanation}
                order={8}
                name="gameStart"
              >
                <CopilotTouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: tagGameStore
                        .getTagGame()
                        .getGameTimeLimit()
                        ? Colors.success
                        : Colors.inactive,
                    },
                  ]}
                  disabled={!canGameStart()}
                  onPress={() => {
                    gameStart();
                  }}
                >
                  <Text>{i18next.t("Game Start")}</Text>
                </CopilotTouchableOpacity>
              </CopilotStep>
            )}
          </>
        ) : (
          <>
            <CopilotStep
              text={gameJoinCameraButtonExplanation}
              order={9}
              name="gameJoinCamera"
            >
              <CopilotTouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: Colors.primary,
                  },
                ]}
                onPress={() => {
                  setCameraVisible(true);
                }}
              >
                <IconSymbol size={28} name={"camera"} color={"white"} />
                <Text>{i18next.t("Join Game")}</Text>
              </CopilotTouchableOpacity>
            </CopilotStep>
            <Button
              title={i18next.t("Leave Game")}
              color="red"
              disabled={!tagGameStore.getTagGame().getId()}
              onPress={async () => {
                Alert.alert(
                  i18next.t("Confirm"),
                  i18next.t("Really leave the game?"),
                  [
                    { text: i18next.t("Cancel"), style: "cancel" },
                    {
                      text: i18next.t("Leave"),
                      style: "destructive",
                      onPress: async () => {
                        try {
                          const gameId = tagGameStore.getTagGame().getId();
                          const userId = userStore.getCurrentUser().getId();
                          await removeUserFromGame(gameId, userId);
                          tagGameStore.initialize();
                          router.replace("/");
                        } catch (e) {
                          Alert.alert(
                            i18next.t("Error"),
                            i18next.t("Failed to leave game"),
                          );
                        }
                      },
                    },
                  ],
                );
              }}
              style={{ marginTop: 10 }}
            />
            <ReactNativeModal
              style={{ margin: "auto" }}
              isVisible={cameraVisible}
            >
              <View
                style={{ backgroundColor: "white", width: 330, padding: 20 }}
              >
                <Text style={{ fontSize: 18 }}>
                  {i18next.t("Let's scan QR and join the game group!!")}
                </Text>
                <CameraView
                  style={{
                    width: 250,
                    height: 300,
                    marginHorizontal: "auto",
                    marginBottom: 20,
                  }}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                  onBarcodeScanned={setDataSettings}
                  facing={"back"}
                />
                <Button
                  type="solid"
                  color={"red"}
                  onPress={() => {
                    setCameraVisible(false);
                    firstScan.current = true;
                  }}
                >
                  {i18next.t("Close")}
                </Button>
              </View>
            </ReactNativeModal>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
  },
});

export default inject("_userStore", "_tagGameStore")(observer(SettingScreen));
