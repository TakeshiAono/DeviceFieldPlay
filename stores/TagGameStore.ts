import { action, observable } from "mobx";
import TagGameModel from "@/models/TagGameModel";

import { DynamoTagGame } from "@/interfaces/api";

export default class TagGameStore {
  @observable.deep
  private currentTagGame!: TagGameModel;

  constructor() {
    this._initialize();
  }

  private _initialize() {
    this.currentTagGame = new TagGameModel({
      id: "",
      liveUsers: [],
      rejectUsers: [],
      areas: [],
      gameMasterDeviceId: "",
    });
  }

  @action
  public putTagGame(tagGame: TagGameModel) {
    this.currentTagGame = tagGame;
  }

  @action
  public putArea(area: DynamoTagGame["areas"]) {
    this.currentTagGame.setAreas(area);
  }

  @action
  public putLiveUsers(liveUsers: DynamoTagGame["liveUsers"]) {
    this.currentTagGame.setLiveUsers(liveUsers);
  }

  @action
  public putRejectUsers(rejectUsers: DynamoTagGame["rejectUsers"]) {
    this.currentTagGame.setRejectUsers(rejectUsers);
  }

  public getTagGame() {
    return this.currentTagGame;
  }
}
