import TagGameStore from "@/stores/TagGameStore";
import UserStore from "@/stores/UserStore";
import { Href, router, useFocusEffect } from "expo-router";
import _ from "lodash";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { InteractionManager, TouchableOpacity, View } from "react-native";
import { useCopilot, walkthroughable } from "react-native-copilot";

// 新しいcopilotを定義する場合はここに名前を追加
export type AllCopilotNames = [
  "validGameArea",
  "plusButton",
  "roleDisplay",
  "minusButton",
  "prisonArea",
  "teamEdit",
  "gameTime",
  "gameStart",
  "gameJoinCamera",
];

type AllCopilotName = AllCopilotNames[number];

const useCopilotHook = (
  userStore: UserStore,
  tagGameStore: TagGameStore,
  firstExplanationName: string,
  targetCopilotNames: AllCopilotName[],
  nextScreenPath: Href | null,
): [
  Dispatch<SetStateAction<boolean>>,
  React.FunctionComponent<any>,
  React.FunctionComponent<any>,
] => {
  const allDefinedCopilotNames: AllCopilotNames = [
    "validGameArea",
    "plusButton",
    "roleDisplay",
    "minusButton",
    "prisonArea",
    "teamEdit",
    "gameTime",
    "gameStart",
    "gameJoinCamera",
  ];

  const { start, unregisterStep, copilotEvents } = useCopilot();

  // NOTE: 依存配列なしのuseEffectだとcopilotがレンダリングされる前に発火している
  // 可能性があり、start()を実行しても説明文が表示されないため
  const [isStart, setIsStart] = useState(false);
  const registerListenerRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const invalidNames = _.difference(
        allDefinedCopilotNames,
        targetCopilotNames,
      );

      invalidNames.forEach((copilotName) => {
        unregisterStep(copilotName);
      });

      if (!registerListenerRef.current) {
        copilotEvents.on("stop", copilotEndHandler);
      }

      registerListenerRef.current = true;

      return () => {
        copilotEvents.off("stop", copilotEndHandler);
      };
    }, []),
  );

  useEffect(() => {
    // アニメーションが完全に終わってから出ないとずれた位置に説明文が表示されてしまう
    InteractionManager.runAfterInteractions(() => {
      start(firstExplanationName);
    });
  }, [isStart]);

  const copilotEndHandler = () => {
    if (!nextScreenPath) return;

    // NOTE: pushだと前画面がアンマウントされておらず前画面のcopilotの説明が流れてしまうためreplace
    router.replace(nextScreenPath);
  };

  const CopilotTouchableOpacity = walkthroughable(TouchableOpacity);
  const CopilotView = walkthroughable(View);

  return [setIsStart, CopilotTouchableOpacity, CopilotView];
};

export default useCopilotHook;
