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
        options={{ title: "ゲーム有効エリア設定" }}
      />
      <Stack.Screen
        name="PrisonAreaScreen"
        options={{ title: "監獄エリア設定" }}
      />
      <Stack.Screen name="TeamEditScreen" options={{ title: "チーム設定" }} />
      <Stack.Screen
        name="GameTimeScreen"
        options={{ title: "タイムリミット設定" }}
      />
    </Stack>
  );
}
