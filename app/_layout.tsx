import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { Provider } from "mobx-react";
import * as Crypto from "expo-crypto";
import ReactNativeModal from "react-native-modal";
import { Button, Text, TextInput, View } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import UserStore from "@/stores/UserStore";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const stores = {
  userStore: new UserStore(),
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [modalView, setModalView] = useState<boolean>(true);
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider {...stores}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <ReactNativeModal style={{ margin: "auto" }} isVisible={modalView}>
          <View style={{ backgroundColor: "white", width: 330, padding: 20 }}>
            <Text
              style={{ fontWeight: "bold", fontSize: 20, marginBottom: 20 }}
            >
              名前登録
            </Text>
            <Text>ゲームで使用する名前を入力してください</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderRadius: 10,
                marginVertical: 30,
              }}
              placeholder="お名前を記入してください"
              onChangeText={(value) => {
                setUserName(value);
              }}
              value={userName}
            />
            <Button
              title="登録"
              onPress={async () => {
                if (userName == undefined) return;
                setModalView(false);
                const randomBytes = await Crypto.getRandomBytesAsync(16);
                stores.userStore.setCurrentUserIdAndName(
                  [...randomBytes]
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(""),
                  userName,
                );
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
    </Provider>
  );
}
