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
  isGameStarted: boolean | null;
} & UserLists;

export type DynamoUser = {
  gameId: GameId;
  name: string;
  userId: string;
};

export type DynamoDevice = {
  gameId: GameId;
  androidDeviceIds: string[];
  iOSDeviceIds: string[];
};
