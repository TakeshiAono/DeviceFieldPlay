import { action, makeObservable, observable } from "mobx";

import TagGameModel, { LocalTagGameModelTypes } from "@/models/TagGameModel";
import UserModel from "@/models/UserModel";
import { DynamoTagGame, DynamoUser } from "@/interfaces/api";

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
      policeUsers: [],
      validAreas: [],
      prisonArea: [],
      gameMasterId: "",
      gameTimeLimit: null,
      isGameStarted: false,
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
  public putLiveUsers(liveUsers: UserModel[]) {
    this.currentTagGame.setLiveUsers(liveUsers);
  }

  /**
   * 生還ユーザーとしてユーザーを追加する
   * @param deviceId
   */
  @action
  public addLiveThiefUsers(users: UserModel[]) {
    this.putLiveUsers([...this.currentTagGame.getLiveUsers(), ...users]);
  }

  /**
   * 脱落ユーザーとしてユーザーを追加する
   * @param deviceId
   */
  @action
  public addRejectThiefUsers(users: UserModel[]) {
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
  public deleteThiefUsers(deleteUsers: UserModel[]) {
    const deleteUserIdSet = new Set(deleteUsers.map((user) => user.getId()));

    const filteredLiveUsers = this.currentTagGame
      .getLiveUsers()
      .filter((user) => !deleteUserIdSet.has(user.getId()));
    this.putLiveUsers(filteredLiveUsers);

    const rejectUsers = this.currentTagGame.getRejectUsers();
    if (rejectUsers === undefined) return;

    const filteredRejectUsers = rejectUsers.filter(
      (user) => !deleteUserIdSet.has(user.getId()),
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
  public putRejectUsers(rejectUsers: UserModel[]) {
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
  public putPoliceUsers(policeUsers: UserModel[]) {
    this.currentTagGame.setPoliceUsers(policeUsers);
  }

  public getLiveUsers() {
    return this.currentTagGame.getLiveUsers();
  }

  public getPoliceUsers() {
    return this.currentTagGame.getPoliceUsers();
  }

  @action
  public addPoliceUsers(users: UserModel[]) {
    this.putPoliceUsers([...this.getPoliceUsers(), ...users]);
  }

  @action
  public deletePoliceUsers(deleteUsers: UserModel[]) {
    const deleteUserIdSet = new Set(deleteUsers.map((user) => user.getId()));

    const filteredUsers = this.getPoliceUsers().filter(
      (user) => !deleteUserIdSet.has(user.getId()),
    );
    this.putPoliceUsers(filteredUsers);
  }

  // TODO updateAllUsersと似ているため統一する
  @action
  public putAllUsers(usersLists: {
    liveUsers: UserModel[];
    policeUsers: UserModel[];
    rejectUsers: UserModel[];
  }) {
    this.putLiveUsers(usersLists.liveUsers);
    this.putRejectUsers(usersLists.rejectUsers);
    this.putPoliceUsers(usersLists.policeUsers);
  }

  /**
   * thiefUsersとpoliceUsers両方から該当ユーザを除外し、ゲームから追放する
   * @param user
   */
  @action
  public kickOutUsers(users: UserModel[]) {
    this.deleteThiefUsers(users);
    this.deletePoliceUsers(users);
  }

  @action
  public changeToPolice(users: UserModel[]) {
    this.deleteThiefUsers(users);
    this.deletePoliceUsers(users);
    this.addPoliceUsers(users);
  }

  @action
  public changeToLiveThief(users: UserModel[]) {
    this.deleteThiefUsers(users);
    this.deletePoliceUsers(users);
    this.addLiveThiefUsers(users);
  }

  @action
  public changeToRejectThief(users: UserModel[]) {
    this.deleteThiefUsers(users);
    this.deletePoliceUsers(users);
    this.addRejectThiefUsers(users);
  }

  @action
  public updateAllUsers(tagGame: DynamoTagGame, gameUsers: DynamoUser[]) {
    this.putLiveUsers(
      TagGameStore.convertUserInstances(gameUsers, tagGame.liveUsers),
    );
    this.putPoliceUsers(
      TagGameStore.convertUserInstances(gameUsers, tagGame.policeUsers),
    );
    this.putRejectUsers(
      TagGameStore.convertUserInstances(gameUsers, tagGame.rejectUsers),
    );
  }

  public getTagGame() {
    return this.currentTagGame;
  }

  public belongingGameGroup(gameId: string) {
    return this.currentTagGame.getId() == gameId;
  }

  public isCurrentUserJoined(userId: string) {
    return this.currentTagGame.joinedUserIds().includes(userId);
  }

  // TODO: 引数をテレコにしたい
  static convertUserInstances(
    dynamoResponseUsers: DynamoUser[],
    gameUserIds: string[],
  ) {
    return gameUserIds.map((gameUserId) => {
      const findUserInfo = dynamoResponseUsers.find(
        (gameUser) => gameUser.userId == gameUserId,
      ) as DynamoUser;

      return new UserModel({
        id: findUserInfo.userId,
        name: findUserInfo.name,
        deviceId: "",
      });
    });
  }
}
