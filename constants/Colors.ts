/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import TagGameStore from "@/stores/TagGameStore";
import UserStore from "@/stores/UserStore";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  primary: "#21D7E0",
  secondary: "#E06D22",

  success: "#54E189",
  warning: "#E0DC61",
  info: "#3F52E0",
  error: "#E05A53",

  inactive: "#DEE2E0",
};

export const MapAreaColors = {
  validArea: "rgba(50,200,50,0.2)",
  prisonArea: "rgba(200,0,0,0.5)",
};

export const RoleColors = {
  police: Colors.info,
  liveUser: Colors.success,
  rejectUser: Colors.error,
  undefined: Colors.inactive,
};

export const getPlayerRoleColor = (
  tagGameStore: TagGameStore,
  userStore: UserStore,
) => {
  if (tagGameStore.getTagGame().getIsGameStarted()) {
    if (tagGameStore.isCurrentUserPolice(userStore.getCurrentUser()))
      return RoleColors.police;
    if (tagGameStore.isCurrentUserLive(userStore.getCurrentUser()))
      return RoleColors.liveUser;
    if (tagGameStore.isCurrentUserReject(userStore.getCurrentUser()))
      return RoleColors.rejectUser;
  } else {
    return "none";
  }
};
