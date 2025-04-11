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

  /**
   * 生還ユーザーとしてユーザーを追加する
   * @param deviceId
   */
  @action
  public addThiefUser(deviceId: string) {
    this.putLiveUsers([...this.currentTagGame.getLiveUsers(), deviceId])
  }

  /**
   * 脱落ユーザー、生存ユーザー両方からuserを削除する
   * @param deviceId 
   */
  @action
  public deleteThiefUser(deviceId: string) {
    const filteredLiveUsers = this.currentTagGame.getLiveUsers().filter(user => user !== deviceId)
    this.putLiveUsers(filteredLiveUsers)

    const rejectUsers = this.currentTagGame.getRejectUsers()
    if(rejectUsers === undefined ) return
    const filteredRejectUsers = rejectUsers.filter(user => user !== deviceId)
    this.putLiveUsers(filteredRejectUsers)
  }

  public getThiefUsers() {
    const thiefUsers = this.currentTagGame.getLiveUsers()
    const rejectUsers = this.currentTagGame.getRejectUsers()
    if(!rejectUsers) return thiefUsers

    thiefUsers.push(...rejectUsers)
    return thiefUsers
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

  @action
  public putPoliceUsers(
    policeUsers: DynamoTagGame["policeUsers"],
  ) {
    this.currentTagGame.setPoliceUsers(policeUsers);
  }

  public getPoliceUsers() {
    return this.currentTagGame.getPoliceUsers();
  }

  @action
  public addPoliceUser(deviceId: string) {
    this.putPoliceUsers([...this.getPoliceUsers(), deviceId])
  }

  @action
  public deletePoliceUser(deviceId: string) {
    const filteredUsers = this.getPoliceUsers().filter(user => user !== deviceId)
    this.putLiveUsers(filteredUsers)
  }

  /**
   * thiefUsersとpoliceUsers両方から該当ユーザを除外し、ゲームから追放する
   * @param user
   */
  @action
  public kickOutUser(user: string) {
    this.deletePoliceUser(user)
    this.deleteThiefUser(user)
  }

  @action
  public thiefChangeToPolice(user: string) {
    const foundUser = this.getThiefUsers().find(thiefUser => thiefUser !== user)
    if(!foundUser) return

    this.deleteThiefUser(user)
    this.addPoliceUser(user)
  }

  @action
  public policeChangeToThief(user: string) {
    const foundUser = this.getPoliceUsers().find(policeUser => policeUser !== user)
    if(!foundUser) return

    this.deletePoliceUser(user)
    this.addThiefUser(user)
  }

  public getTagGame() {
    return this.currentTagGame;
  }
}
