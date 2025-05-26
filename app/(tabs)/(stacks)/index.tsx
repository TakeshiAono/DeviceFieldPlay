import { inject, observer } from "mobx-react";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View, Alert } from "react-native";
import ReactNativeModal from "react-native-modal";

import TagGameStore from "@/stores/TagGameStore";
import UserStore from "@/stores/UserStore";
import { joinUser, putTagGames, putUser } from "@/utils/APIs";
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
    userStore,
    tagGameStore,
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

    const updatedLiveUsers = await joinUser(
      gameId,
      userStore.getCurrentUser().getId(),
    );

    const tagGame = new TagGameModel({
      id: gameId,
      validAreas: tagGameStore.getTagGame().getValidAreas(),
      liveUsers: updatedLiveUsers.liveUsers,
      rejectUsers: [],
      // TODO: ゲームマスターを取得できるようにしたい。現状は自分がゲームマスターでないことしかわからない
      gameMasterId: "",
      prisonArea: [],
      policeUsers: [],
      gameTimeLimit: "",
      isGameStarted: false,
    });
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

  const validGameAreaButtonExplanation =
    "ゲーム内の有効エリアを編集する画面に移動します。ゲーム内から出た泥棒は強制的に脱落扱いとなります。";
  const prisonAreaButtonExplanation =
    "泥棒を収容する監獄エリアを編集する画面に移動します。捕まえた泥棒を収容するエリアを設定します。";
  const teamEditButtonExplanation =
    "警察、泥棒の役割を編集する画面に移動します。";
  const gameTimeButtonExplanation =
    "ゲーム終了時間を編集する画面に移動します。";
  const gameStartButtonExplanation =
    "全ての設定が終了した後にボタンが押せるようになり、ゲームスタートできるようになります。";
  const gameJoinCameraButtonExplanation =
    "ゲームマスターのQRコードを読み取ることで、ゲームマスターが主催しているゲームに参加することができます。";

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
                <Text>ゲーム有効エリア設定</Text>
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
                <Text>監獄エリア設定</Text>
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
                <Text>チーム設定</Text>
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
                <Text>タイムリミット設定</Text>
              </CopilotTouchableOpacity>
            </CopilotStep>
            {tagGameStore.getTagGame().getIsGameStarted() === true ? (
              <Button
                title={"ゲーム中止"}
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
                        ? Colors.primary
                        : Colors.inactive,
                    },
                  ]}
                  disabled={!canGameStart()}
                  onPress={() => {
                    gameStart();
                  }}
                >
                  <Text>ゲームスタート</Text>
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
                <Text>ゲームに参加</Text>
              </CopilotTouchableOpacity>
            </CopilotStep>
            <Button
              title="ゲームから抜ける"
              color="red"
              onPress={async () => {
                Alert.alert("確認", "本当にゲームから抜けますか？", [
                  { text: "キャンセル", style: "cancel" },
                  {
                    text: "抜ける",
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
                          "エラー",
                          "ゲームから抜ける処理に失敗しました",
                        );
                      }
                    },
                  },
                ]);
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
                  {"QRを読み込ませてもらって\nゲームグループに参加しましょう!!"}
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
                  閉じる
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
