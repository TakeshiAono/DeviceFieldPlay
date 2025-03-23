type GameId = string;

export type DynamoTagGame = {
  id: GameId;
  areas: {
    key: number;
    latitude: number;
    longitude: number;
  }[];
  liveUsers: string[];
  rejectUsers: string[];
  gameMasterDeviceId: string;
}

export type DynamoUser = {
  gameId: GameId;
  deviceId: string;
  name: string;
  userId: string;
}

export type DynamoDevice = {
  gameId: GameId;
  androidDeviceIds: string[];
  iOSDeviceIds: string[];
}
