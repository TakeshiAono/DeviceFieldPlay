import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  ScanCommand,
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

// Lambda ハンドラー
export const handler = async (event) => {
  console.log("イベント", event.Records);

  const tableNames = ["devices", "tagGames", "users"];

  try {
    for (const tableName of tableNames) {
      let lastEvaluatedKey = undefined;

      do {
        console.log("スキャン開始: ", tableName);
        const scanResult = await docClient.send(
          new ScanCommand({
            TableName: tableName,
            ExclusiveStartKey: lastEvaluatedKey,
          }),
        );

        const items = scanResult.Items || [];

        console.log("削除開始: ", tableName);

        await Promise.all(
          items.map((item) =>
            docClient.send(
              new DeleteCommand({
                TableName: tableName,
                Key: getKeyParams(tableName, item),
              }),
            ),
          ),
        );

        lastEvaluatedKey = scanResult.LastEvaluatedKey;
      } while (lastEvaluatedKey);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    return {
      statusCode: 200,
      body: JSON.stringify({ error: "Failed to send FCM message" }),
    };
  }
};

const getKeyParams = (tableName, item) => {
  if (tableName === "devices") {
    return { userId: item.userId };
  } else if (tableName === "tagGames") {
    return { id: item.id };
  } else {
    return { userId: item.userId };
  }
};
