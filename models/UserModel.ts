import { makeAutoObservable } from "mobx";

import TagGameModel from "./TagGameModel";

type Props = {
  id: string;
  name: string;
  deviceId: string;
};

export default class UserModel {
  private id: Props["id"];
  private name: Props["name"];
  private deviceId: Props["deviceId"];

  constructor({ id, name, deviceId }: Props) {
    this.id = id;
    this.name = name;
    this.deviceId = deviceId;

    makeAutoObservable(this);
  }

  getId() {
    return this.id;
  }

  setId(id: string) {
    this.id = id;
  }

  getName() {
    return this.name;
  }

  setName(name: string) {
    this.name = name;
  }

  getDeviceId() {
    return this.deviceId;
  }

  setDeviceId(deviceId: string) {
    this.deviceId = deviceId;
  }

  isCurrentGameMaster(targetTagGame: TagGameModel) {
    return this.id === targetTagGame.getGameMasterId();
  }
}
