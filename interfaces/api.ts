import { LatLng } from "react-native-maps";
import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";

import { AbilityList } from "./abilities";
import { Props as UserProps } from "@/models/UserModel";

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

/**
 * publisherがレーダーアビリティを実行した際にAPIリクエストをするインターフェース
 *
 * @param gameId: lambdaにてsubユーザーのpush通知トークンをDynamoのusersテーブルから検索するために使用する。
 * @param currentPosition: push通知先のデバイスにてpublisherの位置情報、subscriber側で距離を算出し自分がレーダー範囲内(50m以内)に該当するか計算する際に使用する。
 * @param publisherId: push通知先のデバイスを経てDynamoのRadarlocationsテーブルに保存する際に使用する、後からpubがポーリングした際の検索キーとして使用する。
 */
export type ExecDistanceForRadarRequest = (
  gameId: DynamoTagGame["id"],
  currentPosition: LatLng,
  publisherId: UserProps["id"],
) => Promise<void>;

/**
 * レーダー範囲内に該当するsubscriberがRaderLocationsテーブルに情報をAPIリクエストにて保存するインターフェース
 */
export type PostRadarLocation = {
  (args: DynamoRadarLocation): Promise<void>;
};

/**
 * RaderLocationsテーブルの定義
 *
 * @param id: プライマリキー
 * @param publisherId: pubがポーリングの時に使用し、自分のuserIdとpublisherIdのレコードを取得する際に使用する検索キー
 * @param location: 現在は使い道はないが、今後詳細な位置を割り出したいなどのアビリティのために保存しておく
 * @param expiresAt: 同じアビリティが実行された場合に古いアビリティの結果が新しいアビリティと混ざらないようにするための値、有効期限が古いものは取得しないようにするための値
 */
export type DynamoRadarLocation = {
  id: string;
  publisherId: UserProps["id"];
  location: LatLng;
  userId: string;
  expiresAt: string;
};

/**
 * ExecDistanceForRadarRequestが発火して10秒後にポーリング(1回)をする時のインターフェース
 *
 * @param publishId: 自分のユーザーIdにてDynamoのRadarLocationsテーブルから検索するために使用する。
 * @returns レーダーに該当した人数分のlocation情報
 */
export interface GetLocationsByUserId {
  (publishId: UserProps["id"]): Promise<DynamoRadarLocation[]>;
}
