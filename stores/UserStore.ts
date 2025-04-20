import TagGameModel from "@/models/TagGameModel";
import UserModel from "@/models/UserModel";
import { action, makeObservable, observable } from "mobx";

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
}
