import { inject, observer } from "mobx-react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import ReactNativeModal from "react-native-modal";

import TagGameStore from "@/stores/TagGameStore";
import UserStore from "@/stores/UserStore";
import { joinUser, patchDevices, putTagGames } from "@/utils/APIs";
import { Button } from "@rneui/themed";
import { useRef, useState } from "react";
import { CameraView } from "expo-camera";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TagGameModel from "@/models/TagGameModel";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function SettingScreen({ _userStore, _tagGameStore }: Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  const [cameraVisible, setCameraVisible] = useState(false);

  const firstScan = useRef(true);

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
    // NOTE: カメラモーダルを閉じた際にtrueに戻します。
    // NOTE: QRが画面上にある限り廉造スキャンしてしまうので最初のスキャン以外は早期リターンしている
    if (!firstScan.current || !userStore.getCurrentUser().getDeviceId()) return;

    firstScan.current = false;
    console.log("ScanData: ", gameId);
    setCameraVisible(false);
    tagGameStore.getTagGame().setId(gameId);
    await patchDevices(gameId, userStore.getCurrentUser().getDeviceId());
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
      isGameStarted: null,
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

  return (
    <View
      style={{ height: "100%", alignItems: "center", backgroundColor: "white" }}
    >
      <View style={{ gap: 100, height: "80%" }}>
        {userStore.isCurrentUserGameMaster(tagGameStore.getTagGame()) ? (
          <>
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
                tagGameStore.getTagGame().getGameTimeLimit()
                  ? "success"
                  : "error"
              }
              title="タイムリミット設定"
              onPress={() => {
                router.push("/GameTimeScreen");
              }}
            ></Button>
            {/* </View> */}
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
          </>
        ) : (
          <>
            <Button
              type="solid"
              onPress={() => {
                setCameraVisible(true);
              }}
              title="ゲームに参加"
              icon={<IconSymbol size={28} name={"camera"} color={"white"} />}
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

export default inject("_userStore", "_tagGameStore")(observer(SettingScreen));
