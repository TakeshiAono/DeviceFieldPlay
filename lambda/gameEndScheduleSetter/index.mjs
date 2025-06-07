import { readFileSync } from "fs";
import googleAuthLibrary from "google-auth-library";
import {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
} from "@aws-sdk/client-scheduler";

const AWS_REGION = process.env.REGION;

const { JWT } = googleAuthLibrary;

const scheduleClient = new SchedulerClient({ region: AWS_REGION });

// Lambda ハンドラー
export const handler = async (event) => {
  if (
    event.Records[0].dynamodb.OldImage == undefined ||
    event.Records[0].dynamodb.NewImage == undefined ||
    !event.Records[0].dynamodb.NewImage.isGameStarted.BOOL
  )
    return;

  try {
    const gameTimeLimit = event.Records[0].dynamodb.NewImage.gameTimeLimit.S;
    console.log(gameTimeLimit);
    if (gameTimeLimit === "") return;
    const date = new Date(gameTimeLimit);
    const formattedGameTimeLimit = date.toISOString().split(".")[0];

    await createSchedule({
      scheduleName: generateScheduleName(
        event.Records[0].dynamodb.NewImage.id.S,
        gameTimeLimit,
      ),
      targetLambdaArn: process.env.TARGET_LAMBDA_ARN,
      roleArn: process.env.ROLE_ARN,
      scheduleTimeUtc: formattedGameTimeLimit, // JST 15:30 相当
      gameId: event.Records[0].dynamodb.NewImage.id.S,
    });

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

export function generateScheduleName(gameId, gameTimeLimit) {
  const date = new Date(gameTimeLimit);
  return (
    gameId +
    +date.getFullYear() +
    date.getDate() +
    date.getHours() +
    date.getMinutes() +
    date.getSeconds()
  );
}

export async function createSchedule({
  scheduleName, // 例: "schedule-dynamo-abc123"
  targetLambdaArn, // Lambda 関数の ARN
  roleArn, // スケジューラーが Lambda を呼び出すための IAM ロール
  scheduleTimeUtc, // 例: "2025-05-06T06:30:00Z"
  gameId, // 任意の ID を渡したい
}) {
  const command = new CreateScheduleCommand({
    Name: scheduleName,
    ScheduleExpression: `at(${scheduleTimeUtc})`,
    GroupName: "default", // ← 明示的に追加！
    FlexibleTimeWindow: { Mode: "OFF" }, // 固定時刻実行
    Target: {
      Arn: targetLambdaArn,
      RoleArn: roleArn,
      Input: JSON.stringify({
        gameId,
      }),
    },
    ActionAfterCompletion: "DELETE",
  });

  try {
    await scheduleClient.send(command);
    console.log(`✅ スケジュール '${scheduleName}' を作成しました`);
  } catch (error) {
    console.error("❌ スケジュール作成失敗:", error);
    throw error;
  }
}

export async function deleteSchedule({
  scheduleName, // 例: "schedule-dynamo-abc123"
}) {
  const command = new DeleteScheduleCommand({
    Name: scheduleName,
    GroupName: "default",
  });

  try {
    await scheduleClient.send(command);
    console.log(`✅ スケジュール '${scheduleName}' を削除しました`);
  } catch (error) {
    console.error("❌ スケジュール削除失敗:", error);
    throw error;
  }
}
