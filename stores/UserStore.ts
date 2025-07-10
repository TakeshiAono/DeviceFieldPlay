import TagGameModel from "@/models/TagGameModel";
import UserModel from "@/models/UserModel";
import { action, makeObservable, observable } from "mobx";
import TagGameStore from "./TagGameStore";

const RoleDisplayString = {
  policeUser: "警察",
  liveUser: "泥(生)",
  rejectUser: "泥(捕)",
};

export default class UserStore {
  @observable.deep
  private currentUser!: UserModel;

  constructor() {
    makeObservable(this);
    this.initialize();
  }

  @action
  public initialize() {
    this.currentUser = new UserModel({ id: "", name: "", deviceId: "" });
  }

  @action
  public setCurrentUserName(name: string) {
    this.currentUser.setName(name);
  }

  public getCurrentUser() {
    return this.currentUser;
  }

  public isCurrentUserGameMaster(targetTagGame: TagGameModel) {
    return this.getCurrentUser().isCurrentGameMaster(targetTagGame);
  }

  public getPlayerRoleName(tagGameStore: TagGameStore) {
    if (tagGameStore.isCurrentUserPolice(this.getCurrentUser()))
      return RoleDisplayString.policeUser;
    if (tagGameStore.isCurrentUserLive(this.getCurrentUser()))
      return RoleDisplayString.liveUser;
    if (tagGameStore.isCurrentUserReject(this.getCurrentUser()))
      return RoleDisplayString.rejectUser;
    // メンバーでログインした時に発火してしまうため無効化している
    // throw new Error("Error: Empty role name error");
    return "";
  }
}
