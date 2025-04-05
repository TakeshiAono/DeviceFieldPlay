import { action, observable } from "mobx";
import _ from "lodash";

import { DynamoTagGame } from "@/interfaces/api";
import TagGameModel, { LocalTagGameModelTypes } from "@/models/TagGameModel";

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
      validAreas: [],
      prisonArea: [],
      gameMasterDeviceId: "",
      policeUsers: [],
    });
  }

  @action
  public putTagGame(tagGame: TagGameModel) {
    this.currentTagGame = tagGame;
  }

  @action
  public putValidArea(validAreas: { latitude: number; longitude: number }[]) {
    const appendedKeyValidAreas = validAreas.map((marker, index) => {
      return { ...marker, key: index + 1 };
    });
    this.currentTagGame.setValidAreas(appendedKeyValidAreas);
  }

  @action
  public putPrisonArea(prisonArea: { latitude: number; longitude: number }[]) {
    const appendedKeyPrisonArea = prisonArea.map((marker, index) => {
      return { ...marker, key: index + 1 };
    });
    this.currentTagGame.setPrisonArea(appendedKeyPrisonArea);
  }

  @action
  public putLiveUsers(liveUsers: DynamoTagGame["liveUsers"]) {
    this.currentTagGame.setLiveUsers(liveUsers);
  }

  @action
  public putRejectUsers(rejectUsers: DynamoTagGame["rejectUsers"]) {
    this.currentTagGame.setRejectUsers(rejectUsers);
  }

  @action
  public setIsSetValidAreaDone(
    isSetValidAreaDone: LocalTagGameModelTypes["isSetValidAreaDone"],
  ) {
    this.currentTagGame.setIsSetValidAreaDone(isSetValidAreaDone);
  }

  public getIsSetDoneValidArea() {
    return this.currentTagGame.getIsSetValidAreaDone();
  }

  @action
  public setIsSetPrisonAreaDone(
    isSetPrisonAreaDone: LocalTagGameModelTypes["isSetPrisonAreaDone"],
  ) {
    this.currentTagGame.setIsSetPrisonAreaDone(isSetPrisonAreaDone);
  }

  public getIsSetDonePrisonArea() {
    return this.currentTagGame.getIsSetPrisonAreaDone();
  }

  public getTagGame() {
    return this.currentTagGame;
  }
}
