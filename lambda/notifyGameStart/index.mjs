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
  console.log("イベント", event.Records);

  if (
    event.Records[0].dynamodb.OldImage == undefined ||
    event.Records[0].dynamodb.NewImage == undefined
  ) {
    return {
      statusCode: 200,
      body: "",
    };
  }

  // ゲームスタート時の最初の処理は早期リターンする
  if (
    event.Records[0].dynamodb.OldImage.isGameStarted?.BOOL ==
    event.Records[0].dynamodb.NewImage.isGameStarted?.BOOL
  ) {
    return {
      statusCode: 200,
      body: "",
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

    let androidMessages = [];
    const isGameStarted = event.Records[0].dynamodb.NewImage.isGameStarted.BOOL;
    androidMessages = androidDeviceIds.map((token) => {
      if (isGameStarted) {
        return {
          message: {
            token,
            notification: {
              title: "ゲームスタート！",
              body: "ゲームが開始しました！",
            },
            data: { notification_type: "gameStart" },
            android: {
              priority: "high",
              notification: {
                channelId: "high_priority",
                sound: "default",
              },
            },
          },
        };
      } else {
        return {
          message: {
            token,
            notification: {
              title: "ゲーム終了！",
              body: "ゲームが終了しました！",
            },
            data: { notification_type: "gameEnd" },
            android: {
              priority: "high",
              notification: {
                channelId: "high_priority",
                sound: "default",
              },
            },
          },
        };
      }
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
      body: JSON.stringify({ success: getMessage("SUCCESS_TRUE") }),
    };
  } catch (error) {
    console.error(
      getMessage("FCM_API_ERROR"),
      error.response ? error.response.data : error.message,
    );
    return {
      statusCode: 200,
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
