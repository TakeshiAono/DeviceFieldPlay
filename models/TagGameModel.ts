import { makeAutoObservable, toJS } from "mobx";
import { DynamoTagGame } from "@/interfaces/api";
import dayjs, { Dayjs } from "dayjs";
import UserModel from "./UserModel";

// DynamoDBでは保存せずクライアント側でのみ保持している値
export type LocalTagGameModelTypes = {
  isSetValidAreaDone: boolean;
  isSetPrisonAreaDone: boolean;
};

export default class TagGameModel {
  private id: DynamoTagGame["id"];
  private liveUsers: UserModel[];
  private rejectUsers: UserModel[];
  private policeUsers: UserModel[];
  private validAreas: DynamoTagGame["validAreas"];
  private prisonArea: DynamoTagGame["prisonArea"];
  private gameTimeLimit: Dayjs | null;
  private gameMasterId: DynamoTagGame["gameMasterId"];
  private isGameStarted: DynamoTagGame["isGameStarted"];

  private isSetValidAreaDone: LocalTagGameModelTypes["isSetValidAreaDone"];
  private isSetPrisonAreaDone: LocalTagGameModelTypes["isSetPrisonAreaDone"];

  constructor({
    id = "",
    validAreas,
    prisonArea,
    gameMasterId,
    gameTimeLimit,
    isGameStarted,
  }: DynamoTagGame) {
    this.id = id;
    this.liveUsers = [];
    this.rejectUsers = [];
    this.policeUsers = [];
    this.validAreas = validAreas;
    this.prisonArea = prisonArea;
    this.gameMasterId = gameMasterId;
    this.gameTimeLimit = gameTimeLimit ? dayjs(gameTimeLimit) : null;
    this.isGameStarted = isGameStarted;

    this.isSetValidAreaDone = false;
    this.isSetPrisonAreaDone = false;

    makeAutoObservable(this);
  }

  // id
  getId(): DynamoTagGame["id"] {
    return this.id;
  }

  setId(id: DynamoTagGame["id"]): void {
    this.id = id;
  }

  // liveUsers
  getLiveUsers(): UserModel[] {
    return this.liveUsers;
  }

  setLiveUsers(liveUsers: UserModel[]): void {
    this.liveUsers = liveUsers;
  }

  // rejectUsers
  getRejectUsers(): UserModel[] {
    return this.rejectUsers;
  }

  setRejectUsers(rejectUsers: UserModel[]): void {
    this.rejectUsers = rejectUsers;
  }

  // validAreas
  getValidAreas(): DynamoTagGame["validAreas"] {
    return toJS(this.validAreas);
  }

  setValidAreas(validAreas: DynamoTagGame["validAreas"]): void {
    this.validAreas = validAreas;
  }

  // prisonArea
  getPrisonArea(): DynamoTagGame["prisonArea"] {
    return toJS(this.prisonArea);
  }

  setPrisonArea(prisonArea: DynamoTagGame["prisonArea"]): void {
    this.prisonArea = prisonArea;
  }

  // gameMasterDeviceId
  getGameMasterId(): DynamoTagGame["gameMasterId"] {
    return this.gameMasterId;
  }

  setGameMasterId(gameMasterId: DynamoTagGame["gameMasterId"]): void {
    this.gameMasterId = gameMasterId;
  }

  // gameTimeLimit
  getGameTimeLimit(): Dayjs | null {
    return this.gameTimeLimit;
  }

  setGameTimeLimit(gameTimeLimit: Dayjs): void {
    this.gameTimeLimit = gameTimeLimit;
  }

  // isSetValidAreaDone
  getIsSetValidAreaDone(): LocalTagGameModelTypes["isSetValidAreaDone"] {
    return this.isSetValidAreaDone;
  }

  setIsSetValidAreaDone(
    isSetValidAreaDone: LocalTagGameModelTypes["isSetValidAreaDone"],
  ): void {
    this.isSetValidAreaDone = isSetValidAreaDone;
  }

  // isSetPrisonAreaDone
  getIsSetPrisonAreaDone(): LocalTagGameModelTypes["isSetPrisonAreaDone"] {
    return this.isSetPrisonAreaDone;
  }

  setIsSetPrisonAreaDone(
    isSetPrisonAreaDone: LocalTagGameModelTypes["isSetPrisonAreaDone"],
  ): void {
    this.isSetPrisonAreaDone = isSetPrisonAreaDone;
  }

  // policeUsers
  getPoliceUsers(): UserModel[] {
    return this.policeUsers;
  }

  setPoliceUsers(policeUsers: UserModel[]): void {
    this.policeUsers = policeUsers;
  }

  getIsGameStarted(): boolean | null {
    return this.isGameStarted;
  }

  setIsGameStarted(isGameStarted: boolean): void {
    this.isGameStarted = isGameStarted;
  }

  isSetGame() {
    return this.id != "";
  }

  toObject(): DynamoTagGame {
    return {
      id: this.id,
      liveUsers: this.liveUsers.map((user) => user.getId()),
      rejectUsers: this.rejectUsers.map((user) => user.getId()),
      validAreas: toJS(this.validAreas),
      prisonArea: toJS(this.prisonArea),
      gameMasterId: this.gameMasterId,
      policeUsers: this.policeUsers.map((user) => user.getId()),
      gameTimeLimit: this.gameTimeLimit ? this.gameTimeLimit.toISOString() : "",
      isGameStarted: this.isGameStarted,
    };
  }
}
