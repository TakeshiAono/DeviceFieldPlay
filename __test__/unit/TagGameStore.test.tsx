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

// Additional tests to cover all public methods of TagGameStore
import UserModel from "@/models/UserModel";

describe("TagGameStore public methods coverage", () => {
  let store: TagGameStore;
  let user1: UserModel;
  let user2: UserModel;
  let user3: UserModel;
  let police: UserModel;
  let reject: UserModel;
  beforeEach(() => {
    store = new TagGameStore();
    user1 = new UserModel({ id: "u1", name: "User1", deviceId: "d1" });
    user2 = new UserModel({ id: "u2", name: "User2", deviceId: "d2" });
    user3 = new UserModel({ id: "u3", name: "User3", deviceId: "d3" });
    police = new UserModel({ id: "p1", name: "Police", deviceId: "dp" });
    reject = new UserModel({ id: "r1", name: "Reject", deviceId: "dr" });
    store.putLiveUsers([user1, user2]);
    store.putPoliceUsers([police]);
    store.putRejectUsers([reject]);
  });

  it("putPrisonArea", () => {
    const prisonArea = [
      { latitude: 1, longitude: 2 },
      { latitude: 3, longitude: 4 },
    ];
    store.putPrisonArea(prisonArea);
    expect(store.getTagGame().getPrisonArea().length).toBe(2);
    expect(store.getTagGame().getPrisonArea()[0]).toHaveProperty("key");
  });

  it("putLiveUsers and getLiveUsers", () => {
    store.putLiveUsers([user3]);
    expect(store.getLiveUsers()).toEqual([user3]);
  });

  it("addLiveThiefUsers", () => {
    store.putLiveUsers([user1]);
    store.addLiveThiefUsers([user2]);
    expect(store.getLiveUsers().map((u) => u.getId())).toEqual(["u1", "u2"]);
  });

  it("addRejectThiefUsers", () => {
    store.putRejectUsers([user1]);
    store.addRejectThiefUsers([user2]);
    expect(
      store
        .getTagGame()
        .getRejectUsers()
        .map((u) => u.getId()),
    ).toEqual(["u1", "u2"]);
  });

  it("deleteThiefUsers", () => {
    store.putLiveUsers([user1, user2]);
    store.putRejectUsers([user3]);
    store.deleteThiefUsers([user1, user3]);
    expect(store.getLiveUsers().map((u) => u.getId())).toEqual(["u2"]);
    expect(store.getTagGame().getRejectUsers()).toEqual([]);
  });

  it("getIsEditTeams and setIsEditTeams", () => {
    expect(store.getIsEditTeams()).toBe(false);
    store.setIsEditTeams(true);
    expect(store.getIsEditTeams()).toBe(true);
  });

  it("putRejectUsers", () => {
    store.putRejectUsers([user1]);
    expect(store.getTagGame().getRejectUsers()).toEqual([user1]);
  });

  it("setIsSetValidAreaDone & getIsSetDoneValidArea", () => {
    store.setIsSetValidAreaDone(true);
    expect(store.getIsSetDoneValidArea()).toBe(true);
  });

  it("setIsSetPrisonAreaDone & getIsSetDonePrisonArea", () => {
    store.setIsSetPrisonAreaDone(true);
    expect(store.getIsSetDonePrisonArea()).toBe(true);
  });

  it("putPoliceUsers and getPoliceUsers", () => {
    store.putPoliceUsers([user1]);
    expect(store.getPoliceUsers()).toEqual([user1]);
  });

  it("addPoliceUsers", () => {
    store.putPoliceUsers([user1]);
    store.addPoliceUsers([user2]);
    expect(store.getPoliceUsers().map((u) => u.getId())).toEqual(["u1", "u2"]);
  });

  it("deletePoliceUsers", () => {
    store.putPoliceUsers([user1, user2]);
    store.deletePoliceUsers([user1]);
    expect(store.getPoliceUsers().map((u) => u.getId())).toEqual(["u2"]);
  });

  it("putAllUsers", () => {
    store.putAllUsers({
      liveUsers: [user1],
      policeUsers: [user2],
      rejectUsers: [user3],
    });
    expect(store.getLiveUsers()).toEqual([user1]);
    expect(store.getPoliceUsers()).toEqual([user2]);
    expect(store.getTagGame().getRejectUsers()).toEqual([user3]);
  });

  it("kickOutUsers", () => {
    store.putLiveUsers([user1]);
    store.putPoliceUsers([user2]);
    store.kickOutUsers([user1, user2]);
    expect(store.getLiveUsers()).toEqual([]);
    expect(store.getPoliceUsers()).toEqual([]);
  });

  it("changeToPolice", () => {
    store.putLiveUsers([user1]);
    store.changeToPolice([user1]);
    expect(store.getPoliceUsers().map((u) => u.getId())).toContain("u1");
    expect(store.getLiveUsers()).not.toContain(user1);
  });

  it("changeToLiveThief", () => {
    store.putPoliceUsers([user1]);
    store.changeToLiveThief([user1]);
    expect(store.getLiveUsers().map((u) => u.getId())).toContain("u1");
    expect(store.getPoliceUsers()).not.toContain(user1);
  });

  it("changeToRejectThief", () => {
    store.putPoliceUsers([user1]);
    store.changeToRejectThief([user1]);
    expect(
      store
        .getTagGame()
        .getRejectUsers()
        .map((u) => u.getId()),
    ).toContain("u1");
    expect(store.getPoliceUsers()).not.toContain(user1);
  });

  it("updateAllUsers", () => {
    const dynamoUsers = [
      { userId: "u1", name: "User1" },
      { userId: "u2", name: "User2" },
      { userId: "u3", name: "User3" },
    ];
    const tagGame = {
      id: "",
      liveUsers: ["u1"],
      policeUsers: ["u2"],
      rejectUsers: ["u3"],
      validAreas: [],
      prisonArea: [],
      gameMasterId: "",
      gameTimeLimit: null,
      isGameStarted: null,
    };
    store.updateAllUsers(tagGame, dynamoUsers as any);
    expect(store.getLiveUsers().map((u) => u.getId())).toEqual(["u1"]);
    expect(store.getPoliceUsers().map((u) => u.getId())).toEqual(["u2"]);
    expect(
      store
        .getTagGame()
        .getRejectUsers()
        .map((u) => u.getId()),
    ).toEqual(["u3"]);
  });

  it("setIsGameTimeUp & getIsGameTimeUp", () => {
    store.setIsGameTimeUp(true);
    expect(store.getIsGameTimeUp()).toBe(true);
  });

  it("getTagGame", () => {
    expect(store.getTagGame()).toBeInstanceOf(TagGameModel);
  });

  it("belongingGameGroup", () => {
    store.getTagGame().setId("gid");
    expect(store.belongingGameGroup("gid")).toBe(true);
    expect(store.belongingGameGroup("other")).toBe(false);
  });

  it("isCurrentUserJoined", () => {
    store.putLiveUsers([user1]);
    expect(store.isCurrentUserJoined("u1")).toBe(true);
    expect(store.isCurrentUserJoined("notjoined")).toBe(false);
  });

  it("isCurrentUserPolice", () => {
    store.putPoliceUsers([police]);
    expect(store.isCurrentUserPolice(police)).toBe(true);
    expect(store.isCurrentUserPolice(user1)).toBe(false);
  });

  it("isCurrentUserLive", () => {
    store.putLiveUsers([user1]);
    expect(store.isCurrentUserLive(user1)).toBe(true);
    expect(store.isCurrentUserLive(police)).toBe(false);
  });

  it("isCurrentUserReject", () => {
    store.putRejectUsers([reject]);
    expect(store.isCurrentUserReject(reject)).toBe(true);
    expect(store.isCurrentUserReject(user1)).toBe(false);
  });

  it("isLiveUsersEmpty", () => {
    store.putLiveUsers([]);
    expect(store.isLiveUsersEmpty()).toBe(true);
    store.putLiveUsers([user1]);
    expect(store.isLiveUsersEmpty()).toBe(false);
  });

  it("getWinnerSide", () => {
    store.putLiveUsers([]);
    expect(store.getWinnerSide()).toBe("police");
    store.putLiveUsers([user1]);
    expect(store.getWinnerSide()).toBe("thief");
  });

  it("getWinnerMessage", () => {
    store.putLiveUsers([]);
    expect(store.getWinnerMessage()).toContain("警察");
    store.putLiveUsers([user1]);
    expect(store.getWinnerMessage()).toContain("泥棒");
  });

  it("thiefWinConditions", () => {
    store.setIsGameTimeUp(true);
    store.putLiveUsers([user1]);
    expect(store.thiefWinConditions()).toBe(true);
    store.setIsGameTimeUp(false);
    expect(store.thiefWinConditions()).toBe(false);
    store.setIsGameTimeUp(true);
    store.putLiveUsers([]);
    expect(store.thiefWinConditions()).toBe(false);
  });

  it("policeWinConditions", () => {
    store.putLiveUsers([]);
    expect(store.policeWinConditions()).toBe(true);
    store.putLiveUsers([user1]);
    expect(store.policeWinConditions()).toBe(false);
  });

  it("getShouldShowGameExplanation & setShouldShowGameExplanation", () => {
    expect(store.getShouldShowGameExplanation()).toBe(false);
    store.setShouldShowGameExplanation(true);
    expect(store.getShouldShowGameExplanation()).toBe(true);
  });

  it("getExplainedSettingScreen & setExplainedSettingScreen", () => {
    expect(store.getExplainedSettingScreen).toBe(false);
    store.setExplainedSettingScreen(true);
    expect(store.getExplainedSettingScreen).toBe(true);
  });

  it("getExplainedShowMapScreen & setExplainedShowMapScreen", () => {
    expect(store.getExplainedShowMapScreen()).toBe(false);
    store.setExplainedShowMapScreen(true);
    expect(store.getExplainedShowMapScreen()).toBe(true);
  });

  it("getExplainedValidAreaScreen & setExplainedValidAreaScreen", () => {
    expect(store.getExplainedValidAreaScreen()).toBe(false);
    store.setExplainedValidAreaScreen(true);
    expect(store.getExplainedValidAreaScreen()).toBe(true);
  });

  it("getExplainedPrisonAreaScreen & setExplainedPrisonAreaScreen", () => {
    expect(store.getExplainedPrisonAreaScreen()).toBe(false);
    store.setExplainedPrisonAreaScreen(true);
    expect(store.getExplainedPrisonAreaScreen()).toBe(true);
  });

  it("getExplainedGameTimeScreen & setExplainedGameTimeScreen", () => {
    expect(store.getExplainedGameTimeScreen()).toBe(false);
    store.setExplainedGameTimeScreen(true);
    expect(store.getExplainedGameTimeScreen()).toBe(true);
  });

  it("getExplainedTeamEditScreen & setExplainedTeamEditScreen", () => {
    expect(store.getExplainedTeamEditScreen()).toBe(false);
    store.setExplainedTeamEditScreen(true);
    expect(store.getExplainedTeamEditScreen()).toBe(true);
  });

  it("isUserInPrisonArea", () => {
    // Setup a square prison area at (0,0), (0,1), (1,1), (1,0)
    const prisonArea = [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
      { latitude: 1, longitude: 1 },
      { latitude: 1, longitude: 0 },
    ];
    store.putPrisonArea(prisonArea);
    // Point inside
    expect(store.isUserInPrisonArea({ latitude: 0.5, longitude: 0.5 })).toBe(
      true,
    );
    // Point outside
    expect(store.isUserInPrisonArea({ latitude: 2, longitude: 2 })).toBe(false);
  });
});
