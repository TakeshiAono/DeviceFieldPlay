import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import Constants from 'expo-constants';
import { Marker } from "@/app/(tabs)/MapScreen";

const AWS_ACCESS_KEY_ID = Constants.expoConfig?.extra?.awsAccessKeyId
const AWS_SECRET_ACCESS_KEY = Constants.expoConfig?.extra?.awsSecretAccessKey;
const AWS_REGION = Constants.expoConfig?.extra?.awsRegion;

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  region: AWS_REGION
});

const docClient = DynamoDBDocumentClient.from(client);

export const dynamoTagGamesGet = async (id: string) => {
  try {
    const command = new GetCommand({
      TableName: "tagGames",
      Key: {
        id: id,
      },
    });
    const response = await docClient.send(command);
    console.log("dynamoTagGamesGet:", response);
    return response;
  } catch (error) {
    console.log(error);
    throw error
  }
};

export const dynamoTagGamesPut = async (item: Marker[]) => {
  try {
    const gameId = uuidv4()
    const command = new PutCommand({
      TableName: "tagGames",
      Item: {
        id: gameId,
        ...item
      },
    });
  
    const response = await docClient.send(command);
    console.log("dynamoTagGamesPut",response);
    return gameId;
  } catch (error) {
    console.log(error)
    throw error
  }
};
