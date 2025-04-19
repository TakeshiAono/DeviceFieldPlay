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
  gameMasterDeviceId: string;
  gameTimeLimit: string;
};

export type DynamoUser = {
  gameId: GameId;
  deviceId: string;
  name: string;
  userId: string;
};

export type DynamoDevice = {
  gameId: GameId;
  androidDeviceIds: string[];
  iOSDeviceIds: string[];
};
