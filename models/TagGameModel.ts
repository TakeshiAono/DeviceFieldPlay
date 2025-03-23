import { makeAutoObservable, toJS } from "mobx";
import { DynamoTagGame } from "@/interfaces/api";

export default class TagGameModel {
  private id: DynamoTagGame["id"];
  private liveUsers: DynamoTagGame["liveUsers"];
  private rejectUsers?: DynamoTagGame["rejectUsers"];
  private areas: DynamoTagGame["areas"];
  private gameMasterDeviceId: DynamoTagGame["gameMasterDeviceId"];

  constructor({ id = "", liveUsers, rejectUsers, areas, gameMasterDeviceId }: DynamoTagGame) {
    this.id = id;
    this.liveUsers = liveUsers;
    this.rejectUsers = rejectUsers;
    this.areas = areas;
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

  // areas
  getAreas(): DynamoTagGame["areas"] {
    return toJS(this.areas);
  }

  setAreas(areas: DynamoTagGame["areas"]): void {
    this.areas = areas;
  }

  // gameMasterDeviceId
  getGameMasterDeviceId(): DynamoTagGame["gameMasterDeviceId"] {
    return this.gameMasterDeviceId;
  }

  setGameMasterDeviceId(gameMasterDeviceId: DynamoTagGame["gameMasterDeviceId"]): void {
    this.gameMasterDeviceId = gameMasterDeviceId;
  }

  isSetGame() {
    return this.id != ""
  }
}
