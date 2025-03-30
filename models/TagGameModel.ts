import { makeAutoObservable, toJS } from "mobx";
import { DynamoTagGame } from "@/interfaces/api";

// DynamoDBでは保存せずクライアント側でのみ保持している値
export type LocalTagGameModelTypes = {
  isSetValidAreaDone: boolean
}

export default class TagGameModel {
  private id: DynamoTagGame["id"];
  private liveUsers: DynamoTagGame["liveUsers"];
  private rejectUsers?: DynamoTagGame["rejectUsers"];
  private validAreas: DynamoTagGame["validAreas"];
  private gameMasterDeviceId: DynamoTagGame["gameMasterDeviceId"];
  private isSetValidAreaDone: LocalTagGameModelTypes["isSetValidAreaDone"];

  constructor({
    id = "",
    liveUsers,
    rejectUsers,
    validAreas,
    gameMasterDeviceId,
  }: DynamoTagGame) {
    this.id = id;
    this.liveUsers = liveUsers;
    this.rejectUsers = rejectUsers;
    this.validAreas = validAreas;
    this.gameMasterDeviceId = gameMasterDeviceId;
    this.isSetValidAreaDone = false;

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

  // gameMasterDeviceId
  getGameMasterDeviceId(): DynamoTagGame["gameMasterDeviceId"] {
    return this.gameMasterDeviceId;
  }

  setGameMasterDeviceId(
    gameMasterDeviceId: DynamoTagGame["gameMasterDeviceId"],
  ): void {
    this.gameMasterDeviceId = gameMasterDeviceId;
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

  isSetGame() {
    return this.id != "";
  }

  toObject(): DynamoTagGame & LocalTagGameModelTypes {
    return {
      id: this.id,
      liveUsers: toJS(this.liveUsers),
      rejectUsers: toJS(this.rejectUsers) ?? [],
      validAreas: toJS(this.validAreas),
      gameMasterDeviceId: this.gameMasterDeviceId,
      isSetValidAreaDone: this.isSetValidAreaDone,
    };
  }
}
