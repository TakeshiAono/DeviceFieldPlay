import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchWriteCommand,
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
  console.log("Daily table cleanup started", event);
  
  try {
    // 各テーブルの全データを削除
    await cleanupTable("tagGames", ["id"]);
    await cleanupTable("users", ["gameId", "userId"]); // Composite key
    await cleanupTable("devices", ["userId"]);
    
    console.log("✅ Daily table cleanup completed successfully");
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: "All tables cleaned up successfully",
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error("❌ Daily table cleanup failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to cleanup tables",
        message: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};

/**
 * 指定されたテーブルのすべてのアイテムを削除する
 * @param {string} tableName テーブル名
 * @param {string[]} keyAttributes 主キーの属性名の配列（composite keyの場合は複数）
 */
async function cleanupTable(tableName, keyAttributes) {
  console.log(`🧹 Cleaning up table: ${tableName}`);
  
  try {
    let lastEvaluatedKey;
    let totalDeleted = 0;
    
    do {
      // テーブルの全アイテムをスキャン
      const scanCommand = new ScanCommand({
        TableName: tableName,
        ProjectionExpression: keyAttributes.join(", "),
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 25, // DynamoDB BatchWriteの制限に合わせて25件ずつ処理
      });
      
      const scanResult = await docClient.send(scanCommand);
      
      if (scanResult.Items && scanResult.Items.length > 0) {
        // バッチ削除リクエストを作成
        const deleteRequests = scanResult.Items.map(item => {
          const key = {};
          keyAttributes.forEach(attr => {
            key[attr] = item[attr];
          });
          return {
            DeleteRequest: {
              Key: key
            }
          };
        });
        
        // バッチ削除を実行
        const batchWriteCommand = new BatchWriteCommand({
          RequestItems: {
            [tableName]: deleteRequests
          }
        });
        
        await docClient.send(batchWriteCommand);
        totalDeleted += deleteRequests.length;
        
        console.log(`Deleted ${deleteRequests.length} items from ${tableName}`);
      }
      
      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    
    console.log(`✅ ${tableName}: ${totalDeleted} items deleted`);
  } catch (error) {
    console.error(`❌ Failed to cleanup table ${tableName}:`, error);
    throw error;
  }
}