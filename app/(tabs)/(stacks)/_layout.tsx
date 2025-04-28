import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      {/* Optionally configure static options outside the route.*/}
      <Stack.Screen name="index" options={{ title: "設定画面" }} />
      <Stack.Screen
        name="ValidAreaScreen"
        options={{ title: "ゲーム範囲設定" }}
      />
      <Stack.Screen
        name="PrisonAreaScreen"
        options={{ title: "刑務所範囲設定" }}
      />
      <Stack.Screen name="TeamEditScreen" options={{ title: "チーム設定" }} />
      <Stack.Screen
        name="GameTimeScreen"
        options={{ title: "ゲーム時間設定" }}
      />
    </Stack>
  );
}
