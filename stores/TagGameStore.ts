import { action, makeObservable, observable } from "mobx";

import { DynamoTagGame } from "@/interfaces/api";
import TagGameModel, { LocalTagGameModelTypes } from "@/models/TagGameModel";

export default class TagGameStore {
  @observable.deep
  private currentTagGame!: TagGameModel;

  @observable
  private isEditTeams!: boolean;

  constructor() {
    makeObservable(this);
    this._initialize();
  }

  private _initialize() {
    this.currentTagGame = new TagGameModel({
      id: "",
      liveUsers: [],
      rejectUsers: [],
      validAreas: [],
      prisonArea: [],
      gameMasterId: "",
      policeUsers: [],
      gameTimeLimit: null,
      isGameStarted: null,
    });
    this.isEditTeams = false;
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
  public addLiveThiefUser(users: string[]) {
    this.putLiveUsers([...this.currentTagGame.getLiveUsers(), ...users]);
  }

  /**
   * 脱落ユーザーとしてユーザーを追加する
   * @param deviceId
   */
  @action
  public addRejectThiefUser(users: string[]) {
    this.putRejectUsers([
      ...(this.currentTagGame.getRejectUsers() ?? []),
      ...users,
    ]);
  }

  /**
   * 脱落ユーザー、生存ユーザー両方からuserを削除する
   * @param deviceId
   */
  @action
  public deleteThiefUser(users: string[]) {
    const filteredLiveUsers = this.currentTagGame
      .getLiveUsers()
      .filter((user) => !users.includes(user));
    this.putLiveUsers(filteredLiveUsers);

    const rejectUsers = this.currentTagGame.getRejectUsers();
    if (rejectUsers === undefined) return;
    const filteredRejectUsers = rejectUsers.filter(
      (user) => !users.includes(user),
    );
    this.putRejectUsers(filteredRejectUsers);
  }

  public getIsEditTeams() {
    return this.isEditTeams;
  }

  @action
  public setIsEditTeams(isEditTeams: boolean) {
    this.isEditTeams = isEditTeams;
  }

  private getThiefUsers() {
    const thiefUsers = this.currentTagGame.getLiveUsers();
    const rejectUsers = this.currentTagGame.getRejectUsers();
    if (!rejectUsers) return thiefUsers;

    thiefUsers.push(...rejectUsers);
    return thiefUsers;
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
  public putPoliceUsers(policeUsers: DynamoTagGame["policeUsers"]) {
    this.currentTagGame.setPoliceUsers(policeUsers);
  }

  public getPoliceUsers() {
    return this.currentTagGame.getPoliceUsers();
  }

  @action
  public addPoliceUser(users: string[]) {
    this.putPoliceUsers([...this.getPoliceUsers(), ...users]);
  }

  @action
  public deletePoliceUser(users: string[]) {
    const filteredUsers = this.getPoliceUsers().filter(
      (user) => !users.includes(user),
    );

    this.putPoliceUsers(filteredUsers);
  }

  /**
   * thiefUsersとpoliceUsers両方から該当ユーザを除外し、ゲームから追放する
   * @param user
   */
  @action
  public kickOutUsers(users: string[]) {
    this.deleteThiefUser(users);
    this.deletePoliceUser(users);
  }

  @action
  public changeToPolice(users: string[]) {
    this.deleteThiefUser(users);
    this.deletePoliceUser(users);
    this.addPoliceUser(users);
  }

  @action
  public changeToLiveThief(users: string[]) {
    this.deleteThiefUser(users);
    this.deletePoliceUser(users);
    this.addLiveThiefUser(users);
  }

  @action
  public changeToRejectThief(users: string[]) {
    this.deleteThiefUser(users);
    this.deletePoliceUser(users);
    this.addRejectThiefUser(users);
  }

  public getTagGame() {
    return this.currentTagGame;
  }

  public belongingGameGroup(gameId: string) {
    return this.currentTagGame.getId() == gameId;
  }
}
