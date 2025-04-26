type GameId = string;

export type Marker = {
  key: number;
  latitude: number;
  longitude: number;
};

export type DynamoTagGame = {
  id: GameId;
  validAreas: Marker[];
  prisonArea: Marker[];
  liveUsers: string[];
  policeUsers: string[];
  rejectUsers: string[];
  gameMasterId: string;
  gameTimeLimit: string | null;
  isGameStarted: boolean | null;
};

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
