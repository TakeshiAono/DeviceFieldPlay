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
    </Stack>
  );
}
