type GameId = string;

type DynamoTagGames = {
  id: GameId;
  areas: {
    key: number;
    latitude: number;
    longitude: number;
  }[];
  liveUsers: string[];
  rejectUsers: string[];
}

type DynamoUsers = {
  gameId: GameId;
  deviceId: string;
  name: string;
  userId: string;
}

type DynamoDevices = {
  gameId: GameId;
  androidDeviceIds: string[];
  iOSDeviceIds: string[];
}
