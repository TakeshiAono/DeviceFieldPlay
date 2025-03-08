import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  PutCommand,
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import Constants from "expo-constants";
import { Marker } from "@/components/Map";
import { Platform } from "react-native";

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

export const getTagGames = async (id: string) => {
  try {
    const command = new GetCommand({
      TableName: "tagGames",
      Key: {
        id: id,
      },
    });
    const response = await docClient.send(command);
    console.log("getTagGames:", response);
    return response.Item;
  } catch (error) {
    console.error("getTagGames:", error);
    throw error;
  }
};

export const putTagGames = async (item: Marker[]) => {
  try {
    const gameId = uuidv4();
    const command = new PutCommand({
      TableName: "tagGames",
      Item: {
        id: gameId,
        ...item,
      },
    });

    const response = await docClient.send(command);
    console.log("putTagGames:", response);
    return gameId;
  } catch (error) {
    console.error("putTagGames:", error);
    throw error;
  }
};

export const joinUser = async (gameId: string, deviceId: string) => {
  try {
    const command = new UpdateCommand({
      TableName: "tagGames",
      Key: { id: gameId },
      UpdateExpression: `SET liveUser = list_append(if_not_exists(liveUser, :emptyList), :newDevice)`,
      ExpressionAttributeValues: {
        ":newDevice": [deviceId],
        ":emptyList": [],
      },
      ReturnValues: "UPDATED_NEW",
    });

    const response = await docClient.send(command);
    console.log("joinUser:", response);
    return response;
  } catch (error) {
    console.error("joinUser:", error);
    throw error;
  }
};

export const putDevices = async (gameId: string, deviceId: string) => {
  const [iOSDeviceList, androidDeviceList] = getIdsByPlatform(deviceId)

  try {
    const command = new PutCommand({
      TableName: "devices",
      Item: {
        gameId: gameId,
        iOSDeviceIds: iOSDeviceList,
        androidDeviceIds: androidDeviceList,
        },
      },
    );

    const response = await docClient.send(command);
    console.log("putDevices:", response);
    return gameId;
  } catch (error) {
    console.error("putDevices:", error);
    throw error;
  }
};

export const patchDevices = async (gameId: string, deviceId: string) => {
  const platformKey = Platform.OS === "ios" ? "iOSDeviceIds" : "androidDeviceIds";

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
        ":emptyList": [],         // 🔹 `deviceIds` が未定義なら空リストをセット
      },
      ReturnValues: "UPDATED_NEW",
    });

    const response = await docClient.send(command);
    console.log("patchDevices:", response);
    return response;
  } catch (error) {
    console.error("patchDevices:", error);
    throw error;
  }
};

const getIdsByPlatform = (deviceId: string) => {
  const iOSDeviceList = []
  const androidDeviceList = []
  if(Platform.OS === "ios") {
    iOSDeviceList.push(deviceId)
  } else {
    androidDeviceList.push(deviceId)
  }

  return [iOSDeviceList, androidDeviceList]
}
