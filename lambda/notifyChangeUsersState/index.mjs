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
    const prevLiveUsersCount =
      event.Records[0].dynamodb.OldImage?.liveUsers?.L.length;
    const newLiveUsersCount =
      event.Records[0].dynamodb.NewImage?.liveUsers?.L.length;
    const prevRejectUsersCount =
      event.Records[0].dynamodb.OldImage?.rejectUsers?.L.length;
    const newRejectUsersCount =
      event.Records[0].dynamodb.NewImage?.rejectUsers?.L.length;
    const prevPoliceUsersCount =
      event.Records[0].dynamodb.OldImage?.policeUsers?.L.length;
    const newPoliceUsersCount =
      event.Records[0].dynamodb.NewImage?.policeUsers?.L.length;

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

    if (prevLiveUsersCount < newLiveUsersCount) {
      const pushMessageTitle = "ユーザー変更通知";
      const pushMessageBody = "ユーザーが復活しました";
      const notificationType = "reviveUser";
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
    } else if (prevRejectUsersCount < newRejectUsersCount) {
      const pushMessageTitle = "ユーザー変更通知";
      const pushMessageBody = "ユーザーが逮捕されました";
      const notificationType = "rejectUser";

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
    } else if (prevPoliceUsersCount < newPoliceUsersCount) {
      const pushMessageTitle = "ユーザー変更通知";
      const pushMessageBody = "ユーザーが警察になりました";
      const notificationType = "policeUser";

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
