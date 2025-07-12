import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import i18next from "i18next";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: i18next.t("MAP"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ThiefListScreen"
        options={{
          title: i18next.t("Thief Status"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AbilityScreen"
        options={{
          title: i18next.t("Ability"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bolt.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(SettingStack)"
        options={{
          title: i18next.t("Setting"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="hammer" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
