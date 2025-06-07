import axios from "axios";
import { readFileSync } from "fs";
import googleAuthLibrary from "google-auth-library";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";

// 日本語メッセージ辞書
const MESSAGES = {
  FCM_API_ERROR: "FCM API エラー:",
  FAILED_TO_SEND_FCM_MESSAGE: "FCMメッセージの送信に失敗しました",
  SUCCESS_TRUE: "処理が正常に完了しました"
};

const getMessage = (key) => MESSAGES[key] || key;

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
  const oldPrisonAreas = event.Records[0].dynamodb.OldImage?.prisonArea;
  const newPrisonAreas = event.Records[0].dynamodb.NewImage?.prisonArea;
  if (!oldPrisonAreas) {
    // エリア変更がない場合は早期リターンで処理を中断
    return {
      statusCode: 200,
      body: "初期のエリア定義です",
    };
  }

  const oldPrisonAreaString = JSON.stringify(oldPrisonAreas);
  const newPrisonAreaString = JSON.stringify(newPrisonAreas);

  if (oldPrisonAreaString == newPrisonAreaString) {
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
    const androidMessages = androidDeviceIds.map((token) => {
      return {
        message: {
          token,
          notification: {
            title: "監獄エリア変更通知",
            body: "監獄エリアが変更されました",
          },
          data: { notification_type: "changePrisonArea" },
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

    await Promise.all(
      androidMessages.map((message) => {
        return axios.post(fcmUrl, message, {
          headers: {
            Authorization: `Bearer ${accessToken}`, // ✅ OAuth 2.0 アクセストークンを使用
            "Content-Type": "application/json",
          },
        });
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: getMessage("SUCCESS_TRUE") }),
    };
  } catch (error) {
    console.error(
      getMessage("FCM_API_ERROR"),
      error.response ? error.response.data : error.message,
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ error: getMessage("FAILED_TO_SEND_FCM_MESSAGE") }),
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
