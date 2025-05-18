import TagGameStore from "@/stores/TagGameStore";
import UserStore from "@/stores/UserStore";
import { Href, router } from "expo-router";
import _ from "lodash";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { InteractionManager, TouchableOpacity, View } from "react-native";
import { useCopilot, walkthroughable } from "react-native-copilot";

// 新しいcopilotを定義する場合はここに名前を追加
export type AllCopilotNames = [
  "plusButton",
  "roleDisplay",
  "minusButton",
  "prisonArea",
  "teamEdit",
  "gameTime",
  "gameStart",
];

type AllCopilotName = AllCopilotNames[number];

const useCopilotHook = (
  userStore: UserStore,
  tagGameStore: TagGameStore,
  targetCopilotNames: AllCopilotName[],
  nextScreenPath: Href,
): [
  Dispatch<SetStateAction<boolean>>,
  React.FunctionComponent<any>,
  React.FunctionComponent<any>,
] => {
  const allDefinedCopilotNames: AllCopilotNames = [
    "plusButton",
    "roleDisplay",
    "minusButton",
    "prisonArea",
    "teamEdit",
    "gameTime",
    "gameStart",
  ];

  const { start, unregisterStep, copilotEvents } = useCopilot();

  // NOTE: 依存配列なしのuseEffectだとcopilotがレンダリングされる前に発火している
  // 可能性があり、start()を実行しても説明文が表示されないため
  const [isStart, setIsStart] = useState(false);

  useEffect(() => {
    const invalidNames = _.difference(
      allDefinedCopilotNames,
      targetCopilotNames,
    );

    invalidNames.forEach((copilotName) => {
      unregisterStep(copilotName);
    });

    copilotEvents.on("start", () => {
      copilotEvents.on("stop", copilotEndHandler);
    });
  }, []);

  useEffect(() => {
    // アニメーションが完全に終わってから出ないとずれた位置に説明文が表示されてしまう
    InteractionManager.runAfterInteractions(() => {
      start();
    });
  }, [isStart]);

  const copilotEndHandler = () => {
    // NOTE: pushだと前画面がアンマウントされておらず前画面のcopilotの説明が流れてしまうためreplace
    router.replace(nextScreenPath);
  };

  const CopilotTouchableOpacity = walkthroughable(TouchableOpacity);
  const CopilotView = walkthroughable(View);

  return [setIsStart, CopilotTouchableOpacity, CopilotView];
};

export default useCopilotHook;
