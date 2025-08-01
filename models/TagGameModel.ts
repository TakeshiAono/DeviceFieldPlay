import { makeAutoObservable, toJS } from "mobx";
import { DynamoTagGame, UserLists } from "@/interfaces/api";
import dayjs, { Dayjs } from "dayjs";
import UserModel from "./UserModel";
import { AbilityList } from "@/interfaces/abilities";

// DynamoDBでは保存せずクライアント側でのみ保持している値
export type LocalTagGameModelTypes = {
  isSetValidAreaDone: boolean;
  isSetPrisonAreaDone: boolean;
  isSetAbilityDone: boolean;
};

export type InitialParamsType = Omit<DynamoTagGame, keyof UserLists>;

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
  private abilityList: DynamoTagGame["abilityList"];

  private isSetValidAreaDone: LocalTagGameModelTypes["isSetValidAreaDone"];
  private isSetPrisonAreaDone: LocalTagGameModelTypes["isSetPrisonAreaDone"];
  private isSetAbilityDone: LocalTagGameModelTypes["isSetAbilityDone"];

  constructor({
    id = "",
    validAreas,
    prisonArea,
    gameMasterId,
    gameTimeLimit,
    isGameStarted,
    abilityList,
  }: InitialParamsType) {
    this.id = id;
    this.liveUsers = [];
    this.rejectUsers = [];
    this.policeUsers = [];
    this.validAreas = validAreas;
    this.prisonArea = prisonArea;
    this.gameMasterId = gameMasterId;
    this.gameTimeLimit = gameTimeLimit ? dayjs(gameTimeLimit) : null;
    this.isGameStarted = isGameStarted;
    this.abilityList = abilityList;

    this.isSetValidAreaDone = false;
    this.isSetPrisonAreaDone = false;
    this.isSetAbilityDone = false;

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

  setGameMasterId(gameMasterId: DynamoTagGame["gameMasterId"]) {
    this.gameMasterId = gameMasterId;
    return this;
  }

  // gameTimeLimit
  getGameTimeLimit(): Dayjs | null {
    return this.gameTimeLimit;
  }

  setGameTimeLimit(gameTimeLimit: Dayjs): void {
    this.gameTimeLimit = gameTimeLimit;
  }

  resetGameTimeLimit(): void {
    this.gameTimeLimit = null;
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

  // isSetAbilityDone
  getIsSetAbilityDone(): LocalTagGameModelTypes["isSetAbilityDone"] {
    return this.isSetAbilityDone;
  }

  setIsSetAbilityDone(
    isSetAbilityDone: LocalTagGameModelTypes["isSetAbilityDone"],
  ): void {
    this.isSetAbilityDone = isSetAbilityDone;
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

  setIsGameStarted(isGameStarted: boolean | null): void {
    this.isGameStarted = isGameStarted;
  }

  getAbilityList(): AbilityList {
    return this.abilityList;
  }

  setAbilityList(abilityList: AbilityList): void {
    this.abilityList = abilityList;
  }

  isSetGame() {
    return this.id != "";
  }

  addLiveUser(user: UserModel) {
    this.setLiveUsers([...this.getLiveUsers(), user]);
  }

  joinedUserIds() {
    return [
      ...this.liveUsers.map((user) => user.getId()),
      ...this.policeUsers.map((user) => user.getId()),
      ...this.rejectUsers.map((user) => user.getId()),
    ];
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
      abilityList: this.abilityList,
    };
  }
}
