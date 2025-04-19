import { makeAutoObservable, toJS } from "mobx";
import { DynamoTagGame } from "@/interfaces/api";
import dayjs, { Dayjs } from "dayjs";

// DynamoDBでは保存せずクライアント側でのみ保持している値
export type LocalTagGameModelTypes = {
  isSetValidAreaDone: boolean;
  isSetPrisonAreaDone: boolean;
};

export default class TagGameModel {
  private id: DynamoTagGame["id"];
  private liveUsers: DynamoTagGame["liveUsers"];
  private rejectUsers?: DynamoTagGame["rejectUsers"];
  private policeUsers: DynamoTagGame["policeUsers"];
  private validAreas: DynamoTagGame["validAreas"];
  private prisonArea: DynamoTagGame["prisonArea"];
  private gameTimeLimit: Dayjs | null;
  private gameMasterDeviceId: DynamoTagGame["gameMasterDeviceId"];

  private isSetValidAreaDone: LocalTagGameModelTypes["isSetValidAreaDone"];
  private isSetPrisonAreaDone: LocalTagGameModelTypes["isSetPrisonAreaDone"];

  constructor({
    id = "",
    liveUsers,
    rejectUsers,
    policeUsers,
    validAreas,
    prisonArea,
    gameMasterDeviceId,
    gameTimeLimit,
  }: DynamoTagGame) {
    this.id = id;
    this.liveUsers = liveUsers;
    this.rejectUsers = rejectUsers;
    this.policeUsers = policeUsers;
    this.validAreas = validAreas;
    this.prisonArea = prisonArea;
    this.gameMasterDeviceId = gameMasterDeviceId;
    this.gameTimeLimit = gameTimeLimit ? dayjs(gameTimeLimit) : null;

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
  getLiveUsers(): DynamoTagGame["liveUsers"] {
    return toJS(this.liveUsers);
  }

  setLiveUsers(liveUsers: DynamoTagGame["liveUsers"]): void {
    this.liveUsers = liveUsers;
  }

  // rejectUsers
  getRejectUsers(): DynamoTagGame["rejectUsers"] | undefined {
    return toJS(this.rejectUsers);
  }

  setRejectUsers(rejectUsers: DynamoTagGame["rejectUsers"]): void {
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
  getGameMasterDeviceId(): DynamoTagGame["gameMasterDeviceId"] {
    return this.gameMasterDeviceId;
  }

  setGameMasterDeviceId(
    gameMasterDeviceId: DynamoTagGame["gameMasterDeviceId"],
  ): void {
    this.gameMasterDeviceId = gameMasterDeviceId;
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
  getPoliceUsers(): DynamoTagGame["policeUsers"] {
    return this.policeUsers;
  }

  setPoliceUsers(policeUsers: DynamoTagGame["policeUsers"]): void {
    this.policeUsers = policeUsers;
  }

  isSetGame() {
    return this.id != "";
  }

  toObject(): DynamoTagGame {
    return {
      id: this.id,
      liveUsers: toJS(this.liveUsers),
      rejectUsers: toJS(this.rejectUsers) ?? [],
      validAreas: toJS(this.validAreas),
      prisonArea: toJS(this.prisonArea),
      gameMasterDeviceId: this.gameMasterDeviceId,
      policeUsers: this.policeUsers,
      gameTimeLimit: this.gameTimeLimit ? this.gameTimeLimit.toISOString() : "",
    };
  }
}
