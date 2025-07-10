import axios from "axios";
import { readFileSync } from "fs";
import googleAuthLibrary from "google-auth-library";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";

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
  if (event.Records[0].eventName === "REMOVE") {
    return {
      statusCode: 200,
      body: "レコード削除は通知処理をしない",
    };
  }

  const oldAreas = event.Records[0].dynamodb.OldImage?.validAreas;
  const newAreas = event.Records[0].dynamodb.NewImage?.validAreas;
  const oldAreasString = JSON.stringify(oldAreas);
  const newAreasString = JSON.stringify(newAreas);

  if (!oldAreas) {
    // エリア変更がない場合は早期リターンで処理を中断
    return {
      statusCode: 200,
      body: "初期のエリア定義です",
    };
  }

  if (oldAreasString == newAreasString) {
    // エリア変更がない場合は早期リターンで処理を中断
    return {
      statusCode: 200,
      body: "エリアの変更はありません",
    };
  }

  const newImage = event.Records[0].dynamodb.NewImage;
  const liveUserIds = newImage?.liveUsers?.L.map((user) => user.S) ?? [];
  const rejectUserIds = newImage?.rejectUsers?.L.map((user) => user.S) ?? [];
  const policeUserIds = newImage?.policeUsers?.L.map((user) => user.S) ?? [];
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
    const iosExpoPushTokens = devices.map((deviceRecord) => {
      if (deviceRecord.deviceType === "ios") {
        return deviceRecord.deviceId;
      }
    });
    const androidDeviceIds = devices.map((deviceRecord) => {
      if (deviceRecord.deviceType === "android") {
        return deviceRecord.deviceId;
      }
    });

    const pushMessageTitle = "有効エリア変更通知";
    const pushMessageBody = "有効エリアが変更されました";

    const accessToken = await getAccessToken();
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${firebaseConfig.project_id}/messages:send`;
    const androidMessages = androidDeviceIds.map((token) => {
      return {
        message: {
          token,
          notification: {
            title: pushMessageTitle,
            body: pushMessageBody,
          },
          data: { notification_type: "changeValidArea" },
          android: {
            // ✅ ここで `priority: "high"` を設定
            priority: "high", // 🚀 高優先度にする
            notification: {
              channelId: "high_priority", // 🚀 事前に `setNotificationChannelAsync()` で作成
              sound: "default", // ✅ 音を鳴らす
            },
          },
        },
      };
    });

    const getIosMessage = (token) => ({
      to: token,
      sound: "default",
      title: pushMessageTitle,
      body: pushMessageBody,
      data: { notification_type: "changeValidArea" },
    });

    await Promise.all([
      ...androidMessages.map((message) => {
        return axios.post(fcmUrl, message, {
          headers: {
            Authorization: `Bearer ${accessToken}`, // ✅ OAuth 2.0 アクセストークンを使用
            "Content-Type": "application/json",
          },
        });
      }),
      ...iosExpoPushTokens.map((token) => {
        return fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(getIosMessage(token)),
        });
      }),
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error(
      "FCM API Error:",
      error.response ? error.response.data : error.message,
      error.response?.data.details,
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
