import TagGameStore from "@/stores/TagGameStore";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import { Alert } from "react-native";

import { fetchCurrentGameUsersInfo, fetchTagGames } from "./APIs";
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
    const tagGame = await fetchTagGames(gameId);
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
    const tagGame = await fetchTagGames(gameId);
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
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    tagGameStore.updateAllUsers(tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const kickOutUsersNotificationHandler = async (
  notification: Notifications.Notification,
  gameId: string,
  tagGameStore: TagGameStore,
  currentUserId: string,
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
    const tagGame = await fetchTagGames(gameId);
    if (!hasGameCurrentUser(tagGame, currentUserId)) {
      Alert.alert(
        "追放連絡",
        "あなたはゲームマスターによって追放されました。ゲームを終了します。",
      );
      tagGameStore.initialize();
      return;
    }
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
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
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameAllProperties(tagGameStore, tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const gameTimeUpNotificationHandler = async (
  notification: Notifications.Notification,
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
    tagGameStore.setIsGameTimeUp(true);
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
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
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
  console.log("逮捕push通知", notification.request.content);

  Toast.show({
    type: "error",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  try {
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameUsers(tagGameStore, tagGame, gameUsers);
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
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameUsers(tagGameStore, tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const policeUserNotificationHandler = async (
  notification: Notifications.Notification,
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  if (notification.request.content.data.notification_type !== "policeUser")
    return;
  console.log("警察push通知", notification.request.content);

  Toast.show({
    type: "success",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  try {
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameUsers(tagGameStore, tagGame, gameUsers);
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

const asyncDynamoTagGameUsers = (
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
};

const hasGameCurrentUser = (game: DynamoTagGame, currentUserId: string) => {
  return (
    game.policeUsers.includes(currentUserId) ||
    game.liveUsers.includes(currentUserId) ||
    game.rejectUsers.includes(currentUserId)
  );
};
