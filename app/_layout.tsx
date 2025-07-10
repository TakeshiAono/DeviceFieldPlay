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
import { Button, Platform, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import { CheckBox } from "@rneui/themed";
import * as Crypto from "expo-crypto";
import "@/i18n";
import i18next from "i18next";
import {
  AndroidImportance,
  getDevicePushTokenAsync,
  getExpoPushTokenAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from "expo-notifications";

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

    if (Platform.OS === "android") {
      // TODO: iosと同じようにgetExpoPushTokenAsyncでpush通知を送るように変更したい
      getDevicePushTokenAsync().then(({ data }) => {
        console.log("deviceId:", data);
        stores._userStore.getCurrentUser().setDeviceId(data);
      });
    } else if (Platform.OS === "ios") {
      getExpoPushTokenAsync().then(({ data }) => {
        console.log("deviceId:", data);
        stores._userStore.getCurrentUser().setDeviceId(data);
      });
    }
    // TODO: storesはいらないので削除したい
  }, [stores, modalView]);

  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      const { status } = await requestPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      await setNotificationChannelAsync("default", {
        name: "default",
        importance: AndroidImportance.MAX,
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
        skip: i18next.t("Skip"),
        previous: i18next.t("Previous"),
        next: i18next.t("Next"),
        finish: i18next.t("Finish"),
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
                {i18next.t("Name Registration")}
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
                title={i18next.t("View app instructions")}
              />
              <Text>
                {i18next.t("Please enter the name to use in the game")}
              </Text>
              <TextInput
                style={{
                  height: 40,
                  borderWidth: 1,
                  borderRadius: 10,
                  marginVertical: 15,
                }}
                placeholder={i18next.t("Please write your name")}
                onChangeText={(value) => {
                  setUserName(value);
                }}
                value={userName}
              />
              <Text>{i18next.t("Please select your role in the game")}</Text>
              <CheckBox
                checked={isGameMaster === true}
                onPress={() => setIsGameMaster(true)}
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                title={i18next.t("Game Master")}
              />
              <CheckBox
                checked={isGameMaster === false}
                onPress={() => setIsGameMaster(false)}
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                title={i18next.t("Member")}
              />
              <Button
                title={i18next.t("Register")}
                disabled={userName === undefined}
                onPress={async () => {
                  if (userName === undefined) return;

                  setModalView(false);
                  stores._userStore.setCurrentUserName(userName);
                  const gameId = Crypto.randomUUID();
                  await putUser(gameId, stores._userStore.getCurrentUser());

                  const currentUser = stores._userStore.getCurrentUser();
                  await putDevice(
                    currentUser.getId(),
                    currentUser.getDeviceId(),
                  );

                  if (isGameMaster) {
                    stores._tagGameStore.getTagGame().setId(gameId);
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
              {i18next.t("Game End Notification")}
            </Text>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 20 }}>
                {i18next.t("Congratulations!")}
              </Text>
              <Text style={{ fontSize: 20 }}>
                {stores._tagGameStore.getWinnerMessage()}
              </Text>
            </View>
            <Text>
              {i18next.t(
                "The game has ended.\nWould you like to play the next game?",
              )}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginTop: 20,
              }}
            >
              <Button
                title={i18next.t("Stop Game")}
                color={"red"}
                onPress={() => {
                  stores._userStore.initialize();
                  stores._tagGameStore.initialize();
                  setModalView(true);
                  setUserName("");
                }}
              ></Button>
              <Button
                title={i18next.t("Inherit settings to next game")}
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
