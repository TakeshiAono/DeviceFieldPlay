import TagGameStore from "@/stores/TagGameStore";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";

import { getCurrentGameUsersInfo, getTagGames } from "./APIs";
import { DynamoTagGame, DynamoUser } from "@/interfaces/api";

export const prisonAreaNotificationHandler = async (
  notification: Notifications.Notification,
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  if (
    notification.request.content.data.notification_type !== "changePrisonArea"
  )
    return;
  console.log("監獄エリア変更push通知", notification.request.content);

  Toast.show({
    type: "info",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  try {
    const tagGame = await getTagGames(gameId);
    tagGameStore.putPrisonArea(tagGame.prisonArea);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const validAreaNotificationHandler = async (
  notification: Notifications.Notification,
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  if (notification.request.content.data.notification_type !== "changeValidArea")
    return;
  console.log("ゲームエリア変更push通知", notification.request.content);

  Toast.show({
    type: "info",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  try {
    const tagGame = await getTagGames(gameId);
    tagGameStore.putValidArea(tagGame.validAreas);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const joinUserNotificationHandler = async (
  notification: Notifications.Notification,
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  if (notification.request.content.data.notification_type !== "joinUser")
    return;
  console.log("ユーザー追加push通知", notification.request.content);

  Toast.show({
    type: "success",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  try {
    const tagGame = await getTagGames(gameId);
    const gameUsers = await getCurrentGameUsersInfo(gameId);
    tagGameStore.updateAllUsers(tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const kickOutUsersNotificationHandler = async (
  notification: Notifications.Notification,
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  if (notification.request.content.data.notification_type !== "kickOutUsers")
    return;
  console.log("ユーザー追放push通知", notification.request.content);

  Toast.show({
    type: "error",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  try {
    const tagGame = await getTagGames(gameId);
    const gameUsers = await getCurrentGameUsersInfo(gameId);
    tagGameStore.putAllUsers({
      liveUsers: TagGameStore.convertUserInstances(
        gameUsers,
        tagGame.liveUsers,
      ),
      policeUsers: TagGameStore.convertUserInstances(
        gameUsers,
        tagGame.policeUsers,
      ),
      rejectUsers: TagGameStore.convertUserInstances(
        gameUsers,
        tagGame.rejectUsers,
      ),
    });
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const gameStartNotificationHandler = async (
  notification: Notifications.Notification,
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  if (notification.request.content.data.notification_type !== "gameStart")
    return;
  console.log("ゲームスタートpush通知", notification.request.content);

  Toast.show({
    type: "success",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  try {
    const tagGame = await getTagGames(gameId);
    const gameUsers = await getCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameAllProperties(tagGameStore, tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const gameStopNotificationHandler = async (
  notification: Notifications.Notification,
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  if (notification.request.content.data.notification_type !== "gameEnd") return;
  console.log("ゲーム終了push通知", notification.request.content);

  Toast.show({
    type: "error",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  try {
    const tagGame = await getTagGames(gameId);
    const gameUsers = await getCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameAllProperties(tagGameStore, tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const rejectUserNotificationHandler = async (
  notification: Notifications.Notification,
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  if (notification.request.content.data.notification_type !== "rejectUser")
    return;
  console.log("脱落push通知", notification.request.content);

  Toast.show({
    type: "error",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  try {
    const tagGame = await getTagGames(gameId);
    const gameUsers = await getCurrentGameUsersInfo(gameId);
    tagGameStore.putRejectUsers(
      TagGameStore.convertUserInstances(gameUsers, tagGame.rejectUsers),
    );
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const liveUserNotificationHandler = async (
  notification: Notifications.Notification,
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  if (notification.request.content.data.notification_type !== "reviveUser")
    return;
  console.log("復活push通知", notification.request.content);

  Toast.show({
    type: "success",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  try {
    const tagGame = await getTagGames(gameId);
    const gameUsers = await getCurrentGameUsersInfo(gameId);
    tagGameStore.putLiveUsers(
      TagGameStore.convertUserInstances(gameUsers, tagGame.liveUsers),
    );
  } catch (error) {
    console.error("Error: ", error);
  }
};

const asyncDynamoTagGameAllProperties = (
  tagGameStore: TagGameStore,
  tagGame: DynamoTagGame,
  gameUsers: DynamoUser[],
) => {
  tagGameStore.putAllUsers({
    liveUsers: TagGameStore.convertUserInstances(gameUsers, tagGame.liveUsers),
    policeUsers: TagGameStore.convertUserInstances(
      gameUsers,
      tagGame.policeUsers,
    ),
    rejectUsers: TagGameStore.convertUserInstances(
      gameUsers,
      tagGame.rejectUsers,
    ),
  });
  tagGameStore.putValidArea(tagGame.validAreas);
  tagGameStore.putPrisonArea(tagGame.prisonArea);
  tagGameStore.getTagGame().setGameMasterId(tagGame.gameMasterId);
  tagGameStore.getTagGame().setGameTimeLimit(dayjs(tagGame.gameTimeLimit));
  tagGameStore.getTagGame().setIsGameStarted(tagGame.isGameStarted);
};
