import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  PutCommand,
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import Constants from "expo-constants";
import { Marker } from "@/components/Map";
import { Platform } from "react-native";
import UserModel from "@/models/UserModel";
import { DynamoDevice, DynamoTagGame, DynamoUser } from "@/interfaces/api";

const AWS_ACCESS_KEY_ID = Constants.expoConfig?.extra?.awsAccessKeyId;
const AWS_SECRET_ACCESS_KEY = Constants.expoConfig?.extra?.awsSecretAccessKey;
const AWS_REGION = Constants.expoConfig?.extra?.awsRegion;

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  region: AWS_REGION,
});

const docClient = DynamoDBDocumentClient.from(client);

export const getTagGames = async <T extends DynamoTagGame>(
  id: T["id"],
): Promise<DynamoTagGame> => {
  try {
    const command = new GetCommand({
      TableName: "tagGames",
      Key: {
        id: id,
      },
    });
    const response = await docClient.send(command);
    console.log("getTagGames:", response);
    return response.Item as DynamoTagGame;
  } catch (error) {
    console.error("getTagGames:", error);
    throw error;
  }
};

export const putTagGames = async <T extends DynamoTagGame>(
  item: T,
): Promise<T> => {
  try {
    const command = new PutCommand({
      TableName: "tagGames",
      Item: item,
    });

    const response = await docClient.send(command);
    console.log("putTagGames:", response);
    return item;
  } catch (error) {
    console.error("putTagGames:", error);
    throw error;
  }
};

export const joinUser = async <T extends DynamoTagGame>(
  gameId: T["id"],
  deviceId: string,
): Promise<Pick<T, "liveUsers">> => {
  try {
    const command = new UpdateCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      UpdateExpression: `SET liveUsers = list_append(if_not_exists(liveUsers, :emptyList), :newDevice)`,
      ExpressionAttributeValues: {
        ":newDevice": [deviceId],
        ":emptyList": [],
      },
      ReturnValues: "UPDATED_NEW",
    });

    const response = await docClient.send(command);
    console.log("joinUser:", response);
    return response.Attributes as Pick<T, "liveUsers">;
  } catch (error) {
    console.error("joinUser:", error);
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
        deviceId: user.getDeviceId(),
        name: user.getName(),
      },
      ReturnValues: "ALL_OLD",
    });

    const response = await docClient.send(command);
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
  deviceId: string,
): Promise<Pick<T, "rejectUsers">> => {
  try {
    const getCommand = new GetCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      ProjectionExpression: "liveUsers",
    });
    const currentData = await docClient.send(getCommand);
    const liveUserList = currentData.Item?.liveUsers || [];

    const deviceIndex = liveUserList.indexOf(deviceId);
    if (deviceIndex === -1) {
      throw new Error("Device ID not found in liveUsers list");
    }

    const command = new UpdateCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      UpdateExpression: `
        SET rejectUsers = list_append(rejectUsers, :newDevice)
        REMOVE liveUsers[${deviceIndex}]`,
      ExpressionAttributeValues: {
        ":newDevice": [deviceId],
      },
      ReturnValues: "UPDATED_NEW",
    });

    const response = await docClient.send(command);
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
  deviceId: string,
): Promise<Pick<T, "liveUsers">> => {
  try {
    const getCommand = new GetCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      ProjectionExpression: "rejectUsers",
    });
    const currentData = await docClient.send(getCommand);
    const rejectUserList = currentData.Item?.rejectUsers || [];

    const deviceIndex = rejectUserList.indexOf(deviceId);
    if (deviceIndex === -1) {
      throw new Error("Device ID not found in rejectUsers list");
    }

    const command = new UpdateCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      UpdateExpression: `SET liveUsers = list_append(if_not_exists(liveUsers, :emptyList), :newDevice) REMOVE rejectUsers[${deviceIndex}]`,
      ExpressionAttributeValues: {
        ":newDevice": [deviceId],
        ":emptyList": [],
      },
      ReturnValues: "UPDATED_NEW",
    });

    const response = await docClient.send(command);
    console.log("reviveUser:", response);
    return response.Attributes as Pick<T, "liveUsers">;
  } catch (error) {
    console.error("reviveUser:", error);
    throw error;
  }
};

export const putDevices = async <T extends DynamoDevice>(
  gameId: T["gameId"],
  deviceId: string,
) => {
  const [iOSDeviceList, androidDeviceList] = _getIdsByPlatform(deviceId);

  try {
    const command = new PutCommand({
      TableName: "devices",
      Item: {
        gameId: gameId,
        iOSDeviceIds: iOSDeviceList,
        androidDeviceIds: androidDeviceList,
      },
    });

    const response = await docClient.send(command);
    console.log("putDevices:", response);
    return gameId;
  } catch (error) {
    console.error("putDevices:", error);
    throw error;
  }
};

export const patchDevices = async <T extends DynamoDevice>(
  gameId: T["gameId"],
  deviceId: string,
): Promise<Pick<T, "androidDeviceIds">> => {
  const platformKey =
    Platform.OS === "ios" ? "iOSDeviceIds" : "androidDeviceIds";

  try {
    const command = new UpdateCommand({
      TableName: "devices",
      Key: { gameId: gameId }, // 🔹 更新対象のキー
      UpdateExpression: `SET #deviceIds = list_append(if_not_exists(#deviceIds, :emptyList), :newDevice)`,
      ExpressionAttributeNames: {
        "#deviceIds": platformKey, // 🔹 iOSかAndroidのキーを動的に指定
      },
      ExpressionAttributeValues: {
        ":newDevice": [deviceId], // 🔹 追加する `deviceId`
        ":emptyList": [], // 🔹 `deviceIds` が未定義なら空リストをセット
      },
      ReturnValues: "UPDATED_NEW",
    });

    const response = await docClient.send(command);
    console.log("patchDevices:", response);
    return response.Attributes as Pick<T, "androidDeviceIds">;
  } catch (error) {
    console.error("patchDevices:", error);
    throw error;
  }
};

const _getIdsByPlatform = (deviceId: string) => {
  const iOSDeviceList = [];
  const androidDeviceList = [];
  if (Platform.OS === "ios") {
    iOSDeviceList.push(deviceId);
  } else {
    androidDeviceList.push(deviceId);
  }

  return [iOSDeviceList, androidDeviceList];
};
