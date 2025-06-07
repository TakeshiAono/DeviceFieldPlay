import {
  SchedulerClient,
  CreateScheduleCommand,
} from "@aws-sdk/client-scheduler";

const AWS_REGION = process.env.REGION;

const scheduleClient = new SchedulerClient({ region: AWS_REGION });

// Lambda ハンドラー
export const handler = async (event) => {
  console.log("Setting up daily table cleanup schedule", event);
  
  try {
    await createDailyCleanupSchedule({
      scheduleName: "daily-table-cleanup-midnight",
      targetLambdaArn: process.env.TARGET_LAMBDA_ARN,
      roleArn: process.env.ROLE_ARN,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: "Daily cleanup schedule created successfully"
      }),
    };
  } catch (error) {
    console.error("❌ Schedule creation failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to create schedule",
        message: error.message
      }),
    };
  }
};

/**
 * 毎日0:00に実行する日次テーブルクリーンアップのスケジュールを作成
 * @param {Object} params スケジュール作成パラメータ
 * @param {string} params.scheduleName スケジュール名
 * @param {string} params.targetLambdaArn ターゲットLambda関数のARN
 * @param {string} params.roleArn スケジューラーが使用するIAMロールのARN
 */
export async function createDailyCleanupSchedule({
  scheduleName,
  targetLambdaArn,
  roleArn,
}) {
  const command = new CreateScheduleCommand({
    Name: scheduleName,
    ScheduleExpression: "cron(0 15 * * ? *)", // 毎日0:00 JST (15:00 UTC前日)
    GroupName: "default",
    FlexibleTimeWindow: { Mode: "OFF" }, // 固定時刻実行
    Target: {
      Arn: targetLambdaArn,
      RoleArn: roleArn,
      Input: JSON.stringify({
        source: "daily-cleanup-scheduler",
        timestamp: new Date().toISOString(),
      }),
    },
    State: "ENABLED",
    Description: "Daily cleanup of all DynamoDB tables at midnight JST (0:00 JST / 15:00 UTC)"
  });

  try {
    await scheduleClient.send(command);
    console.log(`✅ Daily cleanup schedule '${scheduleName}' created successfully`);
    console.log(`Schedule will run daily at 0:00 JST (15:00 UTC)`);
  } catch (error) {
    console.error("❌ Schedule creation failed:", error);
    throw error;
  }
}