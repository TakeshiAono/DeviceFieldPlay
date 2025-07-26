import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  PutCommand,
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import dayjs from "dayjs";
import { Platform } from "react-native";

import Constants from "expo-constants";
import UserModel from "@/models/UserModel";
import {
  DynamoDevice,
  DynamoTagGame,
  DynamoUser,
  GetLocationsByUserId,
  PutDynamoTagGame,
} from "@/interfaces/api";

const AWS_ACCESS_KEY_ID = Constants.expoConfig?.extra?.awsAccessKeyId;
const AWS_SECRET_ACCESS_KEY = Constants.expoConfig?.extra?.awsSecretAccessKey;
const AWS_REGION = Constants.expoConfig?.extra?.awsRegion;

export const generateClient = () => {
  return new DynamoDBClient({
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    region: AWS_REGION,
  });
};

export const generateDocClient = () => {
  return DynamoDBDocumentClient.from(generateClient());
};

export const fetchTagGames = async <T extends DynamoTagGame>(
  id: T["id"],
): Promise<DynamoTagGame> => {
  try {
    const command = new GetCommand({
      TableName: "tagGames",
      Key: {
        id: id,
      },
    });
    const response = await generateDocClient().send(command);
    console.log("fetchTagGames:", response);
    return response.Item as DynamoTagGame;
  } catch (error) {
    console.error("fetchTagGames:", error);
    throw error;
  }
};

export const putTagGames: PutDynamoTagGame = async (item: DynamoTagGame) => {
  try {
    const command = new PutCommand({
      TableName: "tagGames",
      Item: item,
    });

    const response = await generateDocClient().send(command);
    console.log("putTagGames:", response);
    return response;
  } catch (error) {
    console.error("putTagGames:", error);
    throw error;
  }
};

export const getLocationsByPublisherId: GetLocationsByUserId = async (
  publisherId: string,
  abilityName: string,
) => {
  try {
    const command = new ScanCommand({
      TableName: "locations",
      FilterExpression:
        "publisherId = :publisherId AND abilityName = :abilityName AND expiresAt >= :currentDataUNIXTime",
      ExpressionAttributeValues: {
        ":publisherId": { S: publisherId },
        ":abilityName": { S: abilityName },
        ":currentDataUNIXTime": { N: String(dayjs().unix()) },
      },
    });

    const response = await generateDocClient().send(command);
    return response;
  } catch (error) {
    console.error("locations:", error);
    throw error;
  }
};

export const joinUser = async <T extends DynamoTagGame>(
  gameId: T["id"],
  userId: string,
): Promise<Pick<T, "liveUsers">> => {
  try {
    const getCommand = new GetCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      ProjectionExpression: "liveUsers",
    });
    const result = await generateDocClient().send(getCommand);
    const currentUsers = result.Item?.liveUsers ?? [];

    if (currentUsers.includes(userId)) {
      console.log("ユーザーはすでに存在します");
      return { liveUsers: currentUsers };
    }

    // 存在しないなら追加
    const updateCommand = new UpdateCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      UpdateExpression: "SET liveUsers = list_append(liveUsers, :newUserId)",
      ExpressionAttributeValues: {
        ":newUserId": [userId],
      },
      ReturnValues: "UPDATED_NEW",
    });

    const response = await generateDocClient().send(updateCommand);
    return response.Attributes as Pick<T, "liveUsers">;
  } catch (error) {
    console.error("joinUser:", error);
    throw error;
  }
};

export const fetchCurrentGameUsersInfo = async <T extends DynamoUser>(
  gameId: T["gameId"],
): Promise<T[]> => {
  try {
    const command = new ScanCommand({
      TableName: "users",
      FilterExpression: "gameId = :gameId",
      ExpressionAttributeValues: {
        ":gameId": { S: gameId },
      },
    });

    const response = await generateDocClient().send(command);
    console.log("fetchCurrentGameUsersInfo:", response);

    const items = response.Items?.map((item) => unmarshall(item) as T) ?? [];
    return items;
  } catch (error) {
    console.error("fetchCurrentGameUsersInfo:", error);
    throw error;
  }
};

export const putUser = async <T extends DynamoUser>(
  gameId: T["gameId"],
  user: UserModel,
): Promise<T | undefined> => {
  try {
    const command = new PutCommand({
      TableName: "users",
      Item: {
        gameId: gameId,
        userId: user.getId(),
        name: user.getName(),
      },
      ReturnValues: "ALL_OLD",
    });

    const response = await generateDocClient().send(command);
    console.log("putUser:", response);
    return response.Attributes as T | undefined;
  } catch (error) {
    console.error("putUser:", error);
    throw error;
  }
};

// TODO: 複数スマホで同時に実行すると自分じゃないuserをrejectしてしまう可能性があるため、
// dynamoStreamのLambdaで同期対応させるようにする
export const rejectUser = async <T extends DynamoTagGame>(
  gameId: T["id"],
  userId: DynamoUser["userId"],
): Promise<Pick<T, "rejectUsers">> => {
  try {
    const getCommand = new GetCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      ProjectionExpression: "liveUsers",
    });
    const currentData = await generateDocClient().send(getCommand);
    const liveUserList = currentData.Item?.liveUsers || [];

    const userIdIndex = liveUserList.indexOf(userId);
    if (userIdIndex === -1) {
      throw new Error("User ID not found in liveUsers list");
    }

    const command = new UpdateCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      UpdateExpression: `
        SET rejectUsers = list_append(rejectUsers, :newUserId)
        REMOVE liveUsers[${userIdIndex}]`,
      ExpressionAttributeValues: {
        ":newUserId": [userId],
      },
      ReturnValues: "UPDATED_NEW",
    });

    const response = await generateDocClient().send(command);
    console.log("rejectUsers:", response);
    return response.Attributes as Pick<T, "rejectUsers">;
  } catch (error) {
    console.error("rejectUsers:", error);
    throw error;
  }
};

// TODO: スマホ側で同時に実行すると自分じゃないuserをreviveしてしまう可能性があるため、
// dynamoStreamのLambdaで同期対応させるようにする
export const reviveUser = async <T extends DynamoTagGame>(
  gameId: T["id"],
  userId: DynamoUser["userId"],
): Promise<Pick<T, "liveUsers">> => {
  try {
    const getCommand = new GetCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      ProjectionExpression: "rejectUsers",
    });
    const currentData = await generateDocClient().send(getCommand);
    const rejectUserList = currentData.Item?.rejectUsers || [];

    const userIdIndex = rejectUserList.indexOf(userId);
    if (userIdIndex === -1) {
      throw new Error("User ID not found in rejectUsers list");
    }

    const command = new UpdateCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      UpdateExpression: `SET liveUsers = list_append(if_not_exists(liveUsers, :emptyList), :newUserId) REMOVE rejectUsers[${userIdIndex}]`,
      ExpressionAttributeValues: {
        ":newUserId": [userId],
        ":emptyList": [],
      },
      ReturnValues: "UPDATED_NEW",
    });

    const response = await generateDocClient().send(command);
    console.log("reviveUser:", response);
    return response.Attributes as Pick<T, "liveUsers">;
  } catch (error) {
    console.error("reviveUser:", error);
    throw error;
  }
};

export const putDevice = async <T extends DynamoDevice>(
  userId: T["userId"],
  deviceId: string,
) => {
  try {
    const command = new PutCommand({
      TableName: "devices",
      Item: {
        userId: userId,
        deviceId: deviceId,
        deviceType: Platform.OS,
      },
    });

    const response = await generateDocClient().send(command);
    console.log("putDevice:", response);
    return userId;
  } catch (error) {
    console.error("putDevice:", error);
    throw error;
  }
};

/**
 * ゲームから指定ユーザーを完全に外す（liveUsers, rejectUsers, policeUsers すべてから削除）
 * @param gameId ゲームID
 * @param userId ユーザーID
 */
export const removeUserFromGame = async <T extends DynamoTagGame>(
  gameId: T["id"],
  userId: string,
): Promise<void> => {
  // まず現在のユーザーリストを取得
  const getCommand = new GetCommand({
    TableName: "tagGames",
    Key: { id: gameId },
    ProjectionExpression: "liveUsers, rejectUsers, policeUsers",
  });
  const result = await generateDocClient().send(getCommand);
  const liveUsers: string[] = result.Item?.liveUsers ?? [];
  const rejectUsers: string[] = result.Item?.rejectUsers ?? [];
  const policeUsers: string[] = result.Item?.policeUsers ?? [];

  // 各リストからuserIdを除外
  const newLiveUsers = liveUsers.filter((id) => id !== userId);
  const newRejectUsers = rejectUsers.filter((id) => id !== userId);
  const newPoliceUsers = policeUsers.filter((id) => id !== userId);

  // DynamoDBをpatch的に更新
  const updateCommand = new UpdateCommand({
    TableName: "tagGames",
    Key: { id: gameId },
    UpdateExpression:
      "SET liveUsers = :live, rejectUsers = :reject, policeUsers = :police",
    ExpressionAttributeValues: {
      ":live": newLiveUsers,
      ":reject": newRejectUsers,
      ":police": newPoliceUsers,
    },
  });
  await generateDocClient().send(updateCommand);
};
