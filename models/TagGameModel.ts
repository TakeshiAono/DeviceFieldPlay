import { makeAutoObservable, toJS } from "mobx";
import { DynamoTagGame } from "@/interfaces/api";

export default class TagGameModel {
  private id: DynamoTagGame["id"];
  private liveUsers: DynamoTagGame["liveUsers"];
  private rejectUsers?: DynamoTagGame["rejectUsers"];
  private validAreas: DynamoTagGame["validAreas"];
  private gameMasterDeviceId: DynamoTagGame["gameMasterDeviceId"];

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

  isSetGame() {
    return this.id != "";
  }

  toObject(): DynamoTagGame {
    return {
      id: this.id,
      liveUsers: toJS(this.liveUsers),
      rejectUsers: toJS(this.rejectUsers) ?? [],
      validAreas: toJS(this.validAreas),
      gameMasterDeviceId: this.gameMasterDeviceId,
    };
  }
}
