import TagGameStore from "@/stores/TagGameStore";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import { Alert } from "react-native";
import { Notification } from "expo-notifications";
import { randomUUID } from "expo-crypto";

import {
  fetchCurrentGameUsersInfo,
  fetchTagGames,
  putLocation,
} from "./dynamoUtils";
import { DynamoTagGame, DynamoUser } from "@/interfaces/api";
import { getCurrentLocation, isWithinDistance } from "./locations";
import { RoleName } from "@/stores/UserStore";

export const prisonAreaNotificationHandler = async (
  notification: Notification,
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

  await updateStoreOnChangePrisonArea(gameId, tagGameStore);
};

export const updateStoreOnChangePrisonArea = async (
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  try {
    const tagGame = await fetchTagGames(gameId);
    tagGameStore.putPrisonArea(tagGame.prisonArea);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const validAreaNotificationHandler = async (
  notification: Notification,
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

  await updateStoreOnChangeValidArea(gameId, tagGameStore);
};

export const updateStoreOnChangeValidArea = async (
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  try {
    const tagGame = await fetchTagGames(gameId);
    tagGameStore.putValidArea(tagGame.validAreas);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const joinUserNotificationHandler = async (
  notification: Notification,
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

  await updateStoreOnJoinUser(gameId, tagGameStore);
};

export const updateStoreOnJoinUser = async (
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  try {
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    tagGameStore.updateAllUsers(tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const kickOutUsersNotificationHandler = async (
  notification: Notification,
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

  await updateStoreOnKickOutUsers(gameId, tagGameStore, currentUserId);
};

export const updateStoreOnKickOutUsers = async (
  gameId: string,
  tagGameStore: TagGameStore,
  currentUserId: string,
) => {
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
  notification: Notification,
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

  await updateStoreOnGameStart(gameId, tagGameStore);
};

export const updateStoreOnGameStart = async (
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  try {
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameAllProperties(tagGameStore, tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const gameTimeUpNotificationHandler = async (
  notification: Notification,
  tagGameStore: TagGameStore,
) => {
  if (notification.request.content.data.notification_type !== "gameEnd") return;
  console.log("ゲーム終了push通知", notification.request.content);

  Toast.show({
    type: "error",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  await updateStoreOnGameEnd(tagGameStore);
};

export const updateStoreOnGameEnd = async (tagGameStore: TagGameStore) => {
  try {
    tagGameStore.setIsGameTimeUp(true);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const gameStopNotificationHandler = async (
  notification: Notification,
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

  await updateStoreOnGameStop(gameId, tagGameStore);
};

export const updateStoreOnGameStop = async (
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  try {
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameAllProperties(tagGameStore, tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const rejectUserNotificationHandler = async (
  notification: Notification,
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

  await updateStoreOnRejectUser(gameId, tagGameStore);
};

export const updateStoreOnRejectUser = async (
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  try {
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameUsers(tagGameStore, tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const liveUserNotificationHandler = async (
  notification: Notification,
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

  await updateStoreOnReviveUser(gameId, tagGameStore);
};

export const updateStoreOnReviveUser = async (
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  try {
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameUsers(tagGameStore, tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const policeUserNotificationHandler = async (
  notification: Notification,
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

  await updateStoreOnPoliceUser(gameId, tagGameStore);
};

export const updateStoreOnPoliceUser = async (
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  try {
    const tagGame = await fetchTagGames(gameId);
    const gameUsers = await fetchCurrentGameUsersInfo(gameId);
    asyncDynamoTagGameUsers(tagGameStore, tagGame, gameUsers);
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const abilitySettingNotificationHandler = async (
  notification: Notification,
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  if (notification.request.content.data.notification_type !== "abilitySetting")
    return;
  console.log("アビリティpush通知", notification.request.content);

  Toast.show({
    type: "success",
    text1: notification.request.content.title as string,
    text2: notification.request.content.body as string,
  });

  await updateStoreOnAbilitySetting(gameId, tagGameStore);
};

export const abilityNotificationHandler = async (
  notification: Notification,
  userId: string,
  userRoleName: RoleName,
) => {
  if (notification.request.content.data.notification_type !== "execAbility")
    return;

  switch (notification.request.content.data.abilityType) {
    case "radar":
      if (userRoleName !== "泥(生)") return;

      const currentLocation = await getCurrentLocation();
      const publisherLocation = JSON.parse(
        notification.request.content.data.currentPosition,
      );
      const upperLimitDistance = 50; //単位[m]
      if (
        isWithinDistance(currentLocation, publisherLocation, upperLimitDistance)
      ) {
        try {
          await putLocation({
            id: randomUUID(),
            publisherId: notification.request.content.data.publisherId,
            location: currentLocation,
            userId: userId,
            abilityName: notification.request.content.data.abilityType,
            expiresAt: dayjs().add(30, "second").unix(),
          });

          Alert.alert(
            "アビリティ使用検知",
            `レーダーアビリティによって、${upperLimitDistance}m以内にいる事を\n警察に検知されました。`,
          );
        } catch (error) {
          console.log(`Error: ${error}`);
        }
      }
      break;
    default:
      break;
  }
};

export const updateStoreOnAbilitySetting = async (
  gameId: string,
  tagGameStore: TagGameStore,
) => {
  try {
    const tagGame = await fetchTagGames(gameId);
    tagGameStore.putAbilityList(tagGame.abilityList);
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
  tagGameStore.getTagGame().setAbilityList(tagGame.abilityList);
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
