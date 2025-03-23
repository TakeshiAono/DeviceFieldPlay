import UserModel from "@/models/UserModel";
import { action, observable } from "mobx";

export default class UserStore {
  @observable
  currentUser!: UserModel;

  @observable.deep
  liveUsers!: UserModel[];

  @observable.deep
  rejectUsers!: UserModel[];

  constructor() {
    this.initialize();
  }

  @action
  public initialize() {
    this.currentUser = new UserModel({id: "", name: "", deviceId: ""});
    this.liveUsers = [];
    this.rejectUsers = [];
  }

  @action
  public setCurrentUserIdAndName(deviceId: string, name: string) {
    this.currentUser.setDeviceId(deviceId)
    this.currentUser.setName(name)
  }

  public getCurrentUser() {
    return this.currentUser;
  }

  @action
  public addUser(user: UserModel) {
    this.tagUsers.push(user);
  }
}
