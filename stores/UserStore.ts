import UserModel from "@/models/UserModel";
import { action, observable } from "mobx";

export default class UserStore {
  @observable
  currentUser?: UserModel;

  @observable.deep
  tagUsers!: UserModel[];

  constructor() {
    this.initialize();
  }

  @action
  public initialize() {
    this.currentUser = undefined;
    this.tagUsers = [];
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
