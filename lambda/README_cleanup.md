# DynamoDB Daily Table Cleanup Lambda Functions

This directory contains Lambda functions for automatically cleaning up all DynamoDB tables at midnight (0:00 UTC).

## Functions

### 1. dailyTableCleanup
**File**: `lambda/dailyTableCleanup/index.mjs`

This function performs the actual cleanup of all DynamoDB tables:
- Deletes all records from the `tagGames` table
- Deletes all records from the `users` table  
- Deletes all records from the `devices` table

The function uses batch delete operations to efficiently remove all items while preserving the table structure.

**Environment Variables**:
- `ACCESS_KEY`: AWS Access Key ID
- `SECRET_KEY`: AWS Secret Access Key
- `REGION`: AWS Region

### 2. dailyTableCleanupScheduler
**File**: `lambda/dailyTableCleanupScheduler/index.mjs`

This function creates a daily schedule that triggers the cleanup function at midnight JST (0:00 JST / 15:00 UTC).

**Environment Variables**:
- `REGION`: AWS Region
- `TARGET_LAMBDA_ARN`: ARN of the dailyTableCleanup Lambda function
- `ROLE_ARN`: IAM Role ARN for the scheduler

## Deployment

Follow the same deployment process as other Lambda functions in this project:

1. Navigate to the lambda function directory
2. Create a zip file: `zip -r ../layer .`
3. Upload the zip file to the corresponding Lambda function in AWS Console

## Usage

1. Deploy the `dailyTableCleanup` function first
2. Deploy the `dailyTableCleanupScheduler` function
3. Trigger the scheduler function to set up the daily cleanup schedule
4. The cleanup will run automatically every day at 0:00 JST (midnight Japan time)

## Security Considerations

- Ensure the Lambda execution role has the necessary DynamoDB permissions:
  - `dynamodb:Scan`
  - `dynamodb:BatchWriteItem`
- Ensure the scheduler role can invoke the target Lambda function
- The cleanup is irreversible - all data will be permanently deleted