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
  console.log("イベント", event.Records);

  // ゲームスタート時の最初の処理は早期リターンする
  if (
    event.Records[0].dynamodb.OldImage == undefined ||
    event.Records[0].dynamodb.NewImage == undefined
  ) {
    return {
      statusCode: 200,
      body: "",
    };
  }

  const oldRejectUsers = event.Records[0].dynamodb.OldImage.rejectUsers?.L;
  const oldLiveUsers = event.Records[0].dynamodb.OldImage.liveUsers?.L;
  const oldPoliceUsers = event.Records[0].dynamodb.OldImage.policeUsers?.L;
  const newRejectUsers = event.Records[0].dynamodb.NewImage.rejectUsers?.L;
  const newLiveUsers = event.Records[0].dynamodb.NewImage.liveUsers?.L;
  const newPoliceUsers = event.Records[0].dynamodb.NewImage.policeUsers?.L;

  const oldUsersLength =
    oldRejectUsers.length + oldLiveUsers.length + oldPoliceUsers.length;
  const newUsersLength =
    newRejectUsers.length + newLiveUsers.length + newPoliceUsers.length;
  if (oldUsersLength == newUsersLength) {
    return {
      statusCode: 200,
      body: "ユーザーの変更はありません",
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
      data: { notification_type: notification_type },
    });

    if (oldUsersLength < newUsersLength) {
      const pushMessageTitle = "新規ユーザー参加通知";
      const pushMessageBody = "新しいユーザーがゲームに参加しました";
      const notificationType = "joinUser";
      androidMessages = androidDeviceIds.map((token) => {
        return {
          message: {
            token,
            notification: {
              title: pushMessageTitle,
              body: pushMessageBody,
            },
            data: { notification_type: notificationType },
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
        getIosMessage(
          token,
          pushMessageTitle,
          pushMessageBody,
          notificationType,
        ),
      );
    } else if (oldUsersLength > newUsersLength) {
      const pushMessageTitle = "ユーザー追放通知";
      const pushMessageBody = "ユーザーがゲームから追放されました";
      const notificationType = "kickOutUsers";

      androidMessages = androidDeviceIds.map((token) => {
        return {
          message: {
            token,
            notification: {
              title: pushMessageTitle,
              body: pushMessageBody,
            },
            data: { notification_type: notificationType },
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
        getIosMessage(
          token,
          pushMessageTitle,
          pushMessageBody,
          notificationType,
        ),
      );
    }

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
    ]);

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
      statusCode: 200,
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
