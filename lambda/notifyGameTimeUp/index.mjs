import axios from "axios";
import { readFileSync } from "fs";
import googleAuthLibrary from "google-auth-library";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import dayjs from "dayjs";
import { t } from "../../constants/translations.js";

const AWS_ACCESS_KEY_ID = process.env.ACCESS_KEY;
const AWS_SECRET_ACCESS_KEY = process.env.SECRET_KEY;
const AWS_REGION = process.env.REGION;

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  region: AWS_REGION,
});

const docClient = DynamoDBDocumentClient.from(client);

const { JWT } = googleAuthLibrary;

const firebaseConfig = {
  project_id: process.env.FIREBASE_PROJECT_ID,
};

// Lambda ハンドラー
export const handler = async (event) => {
  console.log("イベント", event);
  const gameId = event.gameId;
  const gameTimeLimit = dayjs(event.gameTimeLimit);

  const maxTime = gameTimeLimit.add(1, "minute");
  const minTime = gameTimeLimit.subtract(1, "minute");
  if (!(minTime <= gameTimeLimit && gameTimeLimit <= maxTime)) return;

  const tagGame = await fetchTagGames(gameId);
  const liveUserIds = tagGame.liveUsers;
  const rejectUserIds = tagGame.rejectUsers;
  const policeUserIds = tagGame.policeUsers;
  const allUserIds = [...liveUserIds, ...rejectUserIds, ...policeUserIds];

  try {
    const command = new BatchGetCommand({
      RequestItems: {
        devices: {
          Keys: allUserIds.map((userId) => ({ userId })),
        },
      },
    });

    const response = await docClient.send(command);
    const devices = response.Responses?.devices;
    const androidDeviceIds = devices.map((deviceRecord) => {
      if (deviceRecord.deviceType === "android") {
        return deviceRecord.deviceId;
      }
    });

    // TODO: iOSの通知が実装できていないので、実装する
    // const iOSDeviceIds = devices.map(deviceRecord => {
    //   if(deviceRecord.deviceType === "iOS") {
    //     return deviceRecord.deviceId
    //   }
    // })
    // console.log("iOSDeviceIds", iOSDeviceIds)

    const accessToken = await getAccessToken();
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${firebaseConfig.project_id}/messages:send`;

    let androidMessages = [];
    androidMessages = androidDeviceIds.map((token) => {
      return {
        message: {
          token,
          notification: {
            title: "ゲーム終了",
            body: "ゲーム終了です。",
          },
          data: { notification_type: t("gameEnd") },
          android: {
            priority: "high",
            notification: {
              channelId: "high_priority",
              sound: "default",
            },
          },
        },
      };
    });

    await Promise.all(
      androidMessages.map((message) =>
        axios.post(fcmUrl, message, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }),
      ),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error(t("FCM API Error:"), error);
    return {
      statusCode: 200,
      body: JSON.stringify({ error: t("Failed to send FCM message") }),
    };
  }
};

async function getAccessToken() {
  const serviceAccount = JSON.parse(
    readFileSync("./service-account.json", "utf8"),
  );

  const client = new JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ["https://www.googleapis.com/auth/firebase.messaging"],
  );

  const token = await client.authorize();
  return token.access_token;
}

const fetchTagGames = async (gameId) => {
  try {
    const command = new GetCommand({
      TableName: "tagGames",
      Key: {
        id: gameId,
      },
    });
    const response = await docClient.send(command);
    console.log(t("fetchTagGames:"), response);
    return response.Item;
  } catch (error) {
    console.error(t("fetchTagGames:"), error);
    throw error;
  }
};
