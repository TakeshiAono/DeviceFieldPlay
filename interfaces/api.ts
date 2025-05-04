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
  isGameStarted: boolean;
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
