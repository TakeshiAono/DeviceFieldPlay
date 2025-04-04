import UserModel from "@/models/UserModel";
import { action, observable } from "mobx";

export default class UserStore {
  @observable.deep
  private currentUser!: UserModel;

  constructor() {
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
}
