import { Stack } from "expo-router";
import i18next from "i18next";

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
      <Stack.Screen
        name="index"
        options={{ title: i18next.t("Settings Screen") }}
      />
      <Stack.Screen
        name="ValidAreaScreen"
        options={{ title: i18next.t("Valid Game Area Setting") }}
      />
      <Stack.Screen
        name="PrisonAreaScreen"
        options={{ title: i18next.t("Prison Area Setting") }}
      />
      <Stack.Screen
        name="TeamEditScreen"
        options={{ title: i18next.t("Team Settings") }}
      />
      <Stack.Screen
        name="GameTimeScreen"
        options={{ title: i18next.t("Time Limit Settings") }}
      />
      <Stack.Screen
        name="AbilitySettingScreen"
        options={{ title: i18next.t("Ability Setting") }}
      />
    </Stack>
  );
}
