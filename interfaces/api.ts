import { PutCommandInput, PutCommandOutput } from "@aws-sdk/lib-dynamodb";
import { AbilityList } from "./abilities";

type GameId = string;

export type Marker = {
  key: number;
  latitude: number;
  longitude: number;
};

export type UserLists = {
  liveUsers: string[];
  policeUsers: string[];
  rejectUsers: string[];
};

export type DynamoTagGame = {
  id: GameId;
  validAreas: Marker[];
  prisonArea: Marker[];
  gameMasterId: string;
  gameTimeLimit: string | null;
  isGameStarted: boolean | null; // NOTE: ゲームが始まっていない状態はnullとなる
  abilityList: AbilityList;
} & UserLists;

export type DynamoUser = {
  gameId: GameId;
  name: string;
  userId: string;
};

export type DynamoDevice = {
  userId: string;
  deviceId: string;
  deviceType: "ios" | "android";
};

export type PutDynamoTagGame = (
  item: DynamoTagGame,
) => Promise<PutCommandOutput>;
