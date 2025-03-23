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
    this.currentUser = new UserModel({id: "", name: "", deviceId: ""});
  }

  @action
  public setCurrentUserIdAndName(deviceId: string, name: string) {
    this.currentUser.setDeviceId(deviceId)
    this.currentUser.setName(name)
  }

  public getCurrentUser() {
    return this.currentUser;
  }
}
