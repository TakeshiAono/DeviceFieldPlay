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
  const gameId = event.Records[0].dynamodb.Keys.gameId.S; 
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

    const androidMessages = androidDeviceIds.map((token) => ({
      message: {
        token,
        notification: {
          title: "エリア変更通知",
          body: "エリアが変更されました",
        },
        data: {},
      },
    }));

    androidMessages.forEach(message => {
      axios.post(fcmUrl, message, {
        headers: {
          Authorization: `Bearer ${accessToken}`, // ✅ OAuth 2.0 アクセストークンを使用
          "Content-Type": "application/json",
        },
      });
    });

    console.log("FCM Response:", response.data);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, response: response.data }),
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
