type GameId = string;

export type DynamoTagGames = {
  id: GameId;
  areas: {
    key: number;
    latitude: number;
    longitude: number;
  }[];
  liveUsers: string[];
  rejectUsers: string[];
}

export type DynamoUsers = {
  gameId: GameId;
  deviceId: string;
  name: string;
  userId: string;
}

export type DynamoDevices = {
  gameId: GameId;
  androidDeviceIds: string[];
  iOSDeviceIds: string[];
}
