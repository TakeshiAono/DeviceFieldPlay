import axios from "axios";
import { readFileSync } from "fs";
import googleAuthLibrary from "google-auth-library";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
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
  console.log("イベント", event.Records)

  // 最初のrejectUserが生まれてからrejectUserのkeyが生成されるため、それまではundefinedとなる
  if (event.Records[0].dynamodb.NewImage?.rejectUser == undefined) {
    return {
      statusCode: 200,
      body: "rejectUserは存在しません",
    };  
  }

  const oldRejectUsers = JSON.stringify(event.Records[0].dynamodb.OldImage.rejectUser);
  const newRejectUsers = JSON.stringify(event.Records[0].dynamodb.NewImage.rejectUser);

  if (oldRejectUsers == newRejectUsers) {
    // rejectUserの変更がない場合は早期リターンで処理を中断
    return {
      statusCode: 200,
      body: "rejectUserの変更はありません",
    };
  }

const gameId = event.Records[0].dynamodb.Keys.id.S; 
try {
  const command = new GetCommand({
    TableName: "devices",
    Key: {
        gameId: gameId,
      },
    });
    const deviceResponse = await docClient.send(command);
    console.log("getDevices:", deviceResponse);
    
    const androidDeviceIds = deviceResponse.Item.androidDeviceIds
    // TODO: iOSの通知が実装できていないので、実装する
    // const iOSDeviceIds = deviceResponse.Item.iOSDeviceIds
    
    const accessToken = await getAccessToken();
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${firebaseConfig.project_id}/messages:send`;
    const androidMessages = androidDeviceIds.map((token) => {
      return {
        message: {
          token,
          notification: {
            title: "ユーザー通知",
            body: "ユーザーが脱落しました",
          },
          data: {notification_type: "rejectUser"},
          android: {
            priority: "high",
            notification: {
              channelId: "high_priority",
              sound: "default",
            },
          },
        },
      }
    });

    await Promise.all(androidMessages.map(message => 
      axios.post(fcmUrl, message, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })
    ));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error(
      "FCM API Error:",
      error.response ? error.response.data : error.message
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send FCM message" }),
    };
  }
};

async function getAccessToken() {
  const serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));

  const client = new JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ["https://www.googleapis.com/auth/firebase.messaging"]
  );

  const token = await client.authorize();
  return token.access_token;
}
