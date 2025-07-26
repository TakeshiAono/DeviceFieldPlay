import axios from "axios";
import { readFileSync } from "fs";
import googleAuthLibrary from "google-auth-library";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

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

  try {
    const fetchTagGames = async (gameId) => {
      try {
        const command = new GetCommand({
          TableName: "tagGames",
          Key: {
            id: gameId,
          },
        });
        const response = await docClient.send(command);
        console.log("fetchTagGames:", response);
        return response.Item;
      } catch (error) {
        console.error("fetchTagGames:", error);
        throw error;
      }
    };

    const tagGame = await fetchTagGames(event.gameId);

    const liveUserIds = tagGame.liveUsers;
    const rejectUserIds = tagGame.rejectUsers;
    const policeUserIds = tagGame.policeUsers;
    const allUserIds = [...liveUserIds, ...rejectUserIds, ...policeUserIds];

    const command = new BatchGetCommand({
      RequestItems: {
        devices: {
          Keys: allUserIds.map((userId) => ({ userId })),
        },
      },
    });

    const response = await docClient.send(command);
    const devices = response.Responses?.devices;
    const iosExpoPushTokens = devices
      .filter((deviceRecord) => deviceRecord.deviceType === "ios")
      .map((record) => record.deviceId);
    const androidDeviceIds = devices
      .filter((deviceRecord) => deviceRecord.deviceType === "android")
      .map((record) => record.deviceId);

    const accessToken = await getAccessToken();
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${firebaseConfig.project_id}/messages:send`;

    let androidMessages = [];
    let iosMessages = [];

    const getIosMessage = (
      token,
      pushMessageTitle,
      pushMessageBody,
      notification_type,
    ) => ({
      to: token,
      sound: "default",
      title: pushMessageTitle,
      body: pushMessageBody,
      data: {
        notification_type: notificationType,
        currentPosition: JSON.stringify(event.currentPosition),
        publisherId: event.publisherId,
      },
    });
    const pushMessageTitle = "アビリティ使用通知";
    const pushMessageBody = "ユーザーによってアビリティが使用されました";
    const notificationType = event.abilityType;
    androidMessages = androidDeviceIds.map((token) => {
      return {
        message: {
          token,
          notification: {
            title: pushMessageTitle,
            body: pushMessageBody,
          },
          data: {
            notification_type: notificationType,
            currentPosition: JSON.stringify(event.currentPosition),
            publisherId: event.publisherId,
          },
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
    iosMessages = iosExpoPushTokens.map((token) =>
      getIosMessage(token, pushMessageTitle, pushMessageBody, notificationType),
    );
    await Promise.all([
      ...androidMessages.map((message) =>
        axios.post(fcmUrl, message, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }),
      ),
      ...iosMessages.map((message) => {
        return fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });
      }),
    ])
      .then((value) => console.log(value))
      .catch((error) => console.log(error));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error(
      "FCM API Error:",
      error.response ? error.response.data : error.message,
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send FCM message" }),
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
