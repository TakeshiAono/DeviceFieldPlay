import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { Provider } from "mobx-react";
import ReactNativeModal from "react-native-modal";
import { Button, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { CheckBox } from "@rneui/themed";
import * as Crypto from "expo-crypto";

import { useColorScheme } from "@/hooks/useColorScheme";
import UserStore from "@/stores/UserStore";
import TagGameStore from "@/stores/TagGameStore";
import { joinUser, putDevice, putTagGames, putUser } from "@/utils/APIs";
import { observer } from "mobx-react-lite";
import { CopilotProvider } from "react-native-copilot";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const RootLayout = observer(() => {
  const colorScheme = useColorScheme();
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [modalView, setModalView] = useState<boolean>(true);
  const [isGameMaster, setIsGameMaster] = useState<boolean>(false);
  // NOTE: ホットリロードが走るたびにエラーとなるためuseStateでリロードのたびに各storeが再生成されないようにする
  const [stores] = useState(() => ({
    _userStore: new UserStore(),
    _tagGameStore: new TagGameStore(),
  }));

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!modalView) return;

    const id = Crypto.randomUUID();
    stores._userStore.getCurrentUser().setId(id);

    Notifications.getDevicePushTokenAsync().then(({ data }) => {
      console.log("deviceId:", data);
      stores._userStore.getCurrentUser().setDeviceId(data);
    });
    // TODO: storesはいらないので削除したい
  }, [stores, modalView]);

  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    registerForPushNotificationsAsync();
  }, []);

  return (
    <CopilotProvider
      // NOTE: 説明欄コンポーネントにステップ番号を出したくないためEmptyComponentを格納している
      stepNumberComponent={EmptyComponent}
      labels={{
        skip: "スキップ",
        previous: "前に戻る",
        next: "次へ",
        finish: "完了",
      }}
    >
      <Provider {...stores}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <ReactNativeModal style={{ margin: "auto" }} isVisible={modalView}>
            <View style={{ backgroundColor: "white", width: 330, padding: 20 }}>
              <Text
                style={{ fontWeight: "bold", fontSize: 20, marginBottom: 20 }}
              >
                名前登録
              </Text>
              <CheckBox
                checked={stores._tagGameStore.getShouldShowGameExplanation()}
                onPress={() =>
                  stores._tagGameStore.setShouldShowGameExplanation(
                    !stores._tagGameStore.getShouldShowGameExplanation(),
                  )
                }
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                title={"アプリの使い方をみる"}
              />
              <Text>ゲームで使用する名前を入力してください</Text>
              <TextInput
                style={{
                  height: 40,
                  borderWidth: 1,
                  borderRadius: 10,
                  marginVertical: 15,
                }}
                placeholder="お名前を記入してください"
                onChangeText={(value) => {
                  setUserName(value);
                }}
                value={userName}
              />
              <Text>あなたのゲーム内での役職を選んでください</Text>
              <CheckBox
                checked={isGameMaster === true}
                onPress={() => setIsGameMaster(true)}
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                title={"ゲームマスター"}
              />
              <CheckBox
                checked={isGameMaster === false}
                onPress={() => setIsGameMaster(false)}
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                title={"メンバー"}
              />
              <Button
                title="登録"
                disabled={userName === undefined}
                onPress={async () => {
                  if (userName === undefined) return;

                  const gameId = Crypto.randomUUID();
                  stores._tagGameStore.getTagGame().setId(gameId);
                  setModalView(false);
                  stores._userStore.setCurrentUserName(userName);
                  await putUser(gameId, stores._userStore.getCurrentUser());

                  const currentUser = stores._userStore.getCurrentUser();
                  await putDevice(
                    currentUser.getId(),
                    currentUser.getDeviceId(),
                  );

                  if (isGameMaster) {
                    stores._tagGameStore
                      .getTagGame()
                      .setGameMasterId(
                        stores._userStore.getCurrentUser().getId(),
                      )
                      .addLiveUser(stores._userStore.getCurrentUser());

                    await putTagGames(
                      stores._tagGameStore.getTagGame().toObject(),
                    );
                    await joinUser(
                      gameId,
                      stores._userStore.getCurrentUser().getId(),
                    );
                  }
                }}
              />
            </View>
          </ReactNativeModal>

          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
        <Toast />
        <ReactNativeModal
          style={{ margin: "auto" }}
          isVisible={
            stores._tagGameStore.getTagGame().getIsGameStarted() !== null &&
            (stores._tagGameStore.thiefWinConditions() ||
              stores._tagGameStore.policeWinConditions())
          }
        >
          <View style={{ backgroundColor: "white", width: 350, padding: 20 }}>
            <Text
              style={{ fontWeight: "bold", fontSize: 25, marginBottom: 20 }}
            >
              ゲーム終了通知
            </Text>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 20 }}>おめでとうございます！🎉</Text>
              <Text style={{ fontSize: 20 }}>
                {stores._tagGameStore.getWinnerMessage()}
              </Text>
            </View>
            <Text>{"ゲームが終了しました。\n次のゲームを行いますか？"}</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginTop: 20,
              }}
            >
              <Button
                title={"ゲームをやめる"}
                color={"red"}
                onPress={() => {
                  stores._userStore.initialize();
                  stores._tagGameStore.initialize();
                  setModalView(true);
                  setUserName("");
                }}
              ></Button>
              <Button
                title={"次ゲームへ設定を引き継ぐ"}
                onPress={() => {
                  stores._tagGameStore.setIsGameTimeUp(false);
                  stores._tagGameStore.getTagGame().resetGameTimeLimit();
                  stores._tagGameStore.getTagGame().setIsGameStarted(false);
                }}
              ></Button>
            </View>
          </View>
        </ReactNativeModal>
      </Provider>
    </CopilotProvider>
  );
});

export default RootLayout;

const EmptyComponent = () => {
  return <></>;
};
