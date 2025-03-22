import UserModel from "@/models/UserModel";
import { action, observable } from "mobx";

export default class UserStore {
  @observable
  currentUser?: UserModel;

  @observable.deep
  liveUsers!: UserModel[];

  @observable.deep
  rejectUsers!: UserModel[];

  constructor() {
    this.initialize();
  }

  @action
  public initialize() {
    this.currentUser = undefined;
    this.liveUsers = [];
    this.rejectUsers = [];
  }

  @action
  public setCurrentUserIdAndName(id: string, name: string) {
    const user = new UserModel({ id: id, name: name, deviceId: "" });
    this.currentUser = user;
  }

  public getCurrentUser() {
    return this.currentUser;
  }

  @action
  public addUser(user: UserModel) {
    this.tagUsers.push(user);
  }
}
