import {
  SchedulerClient,
  DeleteScheduleCommand,
} from "@aws-sdk/client-scheduler";

const AWS_REGION = process.env.REGION;

const scheduleClient = new SchedulerClient({ region: AWS_REGION });

// Lambda ハンドラー
export const handler = async (event) => {
  console.log("スケジュール削除イベント:", event);

  const { gameId, gameTimeLimit } = event;

  if (!gameId || !gameTimeLimit) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "gameId and gameTimeLimit are required" }),
    };
  }

  try {
    const scheduleName = generateScheduleName(gameId, gameTimeLimit);

    await deleteSchedule({
      scheduleName,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Schedule ${scheduleName} deleted successfully`,
      }),
    };
  } catch (error) {
    console.error("スケジュール削除エラー:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to delete schedule",
        details: error.message,
      }),
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
