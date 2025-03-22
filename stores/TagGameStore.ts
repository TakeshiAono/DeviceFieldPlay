import { action, observable } from "mobx";
import TagGameModel from "@/models/TagGameModel";

export default class TagGameStore {
  @observable.deep
  private currentTagGame!: TagGameModel;

  constructor() {
    this._initialize();
  }

  private _initialize() {
    this.currentTagGame = new TagGameModel({id: "", liveUsers: [], rejectUsers: [], areas: [],gameMasterDeviceId: ""});
  }

  @action
  public putTagGame(tagGame: TagGameModel) {
    this.currentTagGame = tagGame
  }

  public getTagGame() {
    return this.currentTagGame
  }
}
