import UserStore from "@/stores/UserStore";
import TagGameStore from "@/stores/TagGameStore";
import TagGameModel, { InitialParamsType } from "@/models/TagGameModel";
import { DynamoTagGame } from "@/interfaces/api";

describe("TagGameStoreユニットテスト", () => {
  const tagGameStore = new TagGameStore();
  const params: InitialParamsType = {
    id: "",
    validAreas: [],
    prisonArea: [],
    gameMasterId: "testId",
    gameTimeLimit: "aaa",
    isGameStarted: true,
  };

  const tagGameModel = new TagGameModel(params);
  // const userName = "testユーザー";
  // userStore.getCurrentUser().setId("testId");
  // userStore.setCurrentUserName(userName);

  it("putTagGame", () => {
    tagGameStore.putTagGame(tagGameModel);
    expect(tagGameStore.getTagGame()).toBe(tagGameModel);
  });

  it("putValidArea", () => {
    const areas = [
      {
        key: 1,
        latitude: 0,
        longitude: 0,
      },
    ];
    tagGameStore.putValidArea(areas);
    expect(tagGameStore.getTagGame().getValidAreas()).toEqual(areas);
  });

  // it("getCurrentUser", () => {
  //   const userModel = userStore.getCurrentUser();
  //   expect(userModel.getName()).toBe(userName);
  // });

  // describe("isCurrentUserGameMaster", () => {
  //   const userModel = userStore.getCurrentUser();
  //   const tagGameStore = new TagGameStore();
  //   const tagGameModel = tagGameStore.getTagGame();
  //   it("ゲームマスターではない時", () => {
  //     expect(userStore.isCurrentUserGameMaster(tagGameModel)).toBeFalsy();
  //   });

  //   it("ゲームマスターの時", () => {
  //     tagGameModel.setGameMasterId(userModel.getId());
  //     expect(userStore.isCurrentUserGameMaster(tagGameModel)).toBeTruthy();
  //   });
  // });

  // it("getPlayerRoleName", () => {
  //   let tagGameStore = new TagGameStore();
  //   tagGameStore.addPoliceUsers([userStore.getCurrentUser()]);
  //   let userRole = userStore.getPlayerRoleName(tagGameStore);
  //   expect(userRole).toBe("警察");

  //   tagGameStore = new TagGameStore();
  //   tagGameStore.addLiveThiefUsers([userStore.getCurrentUser()]);
  //   userRole = userStore.getPlayerRoleName(tagGameStore);
  //   expect(userRole).toBe("泥(生)");

  //   tagGameStore = new TagGameStore();
  //   tagGameStore.addRejectThiefUsers([userStore.getCurrentUser()]);
  //   userRole = userStore.getPlayerRoleName(tagGameStore);
  //   expect(userRole).toBe("泥(捕)");

  //   tagGameStore = new TagGameStore();
  //   expect(() => {
  //     userStore.getPlayerRoleName(tagGameStore);
  //   }).toThrow();
  // });

  // it("initialize", () => {
  //   userStore.initialize();
  //   expect(userStore.getCurrentUser().getId()).toBe("");
  //   expect(userStore.getCurrentUser().getName()).toBe("");
  //   expect(userStore.getCurrentUser().getDeviceId()).toBe("");
  // });
});
