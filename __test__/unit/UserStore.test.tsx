import UserStore from "@/stores/UserStore";
import TagGameStore from "@/stores/TagGameStore";

describe("UserStoreユニットテスト", () => {
  const userStore = new UserStore();
  const userName = "testユーザー";
  userStore.getCurrentUser().setId("testId");
  userStore.setCurrentUserName(userName);

  it("setCurrentUserName", () => {
    expect(userStore.getCurrentUser().getName()).toBe(userName);
  });

  it("getCurrentUser", () => {
    const userModel = userStore.getCurrentUser();
    expect(userModel.getName()).toBe(userName);
  });

  describe("isCurrentUserGameMaster", () => {
    const userModel = userStore.getCurrentUser();
    const tagGameStore = new TagGameStore();
    const tagGameModel = tagGameStore.getTagGame();
    it("ゲームマスターではない時", () => {
      expect(userStore.isCurrentUserGameMaster(tagGameModel)).toBeFalsy();
    });

    it("ゲームマスターの時", () => {
      tagGameModel.setGameMasterId(userModel.getId());
      expect(userStore.isCurrentUserGameMaster(tagGameModel)).toBeTruthy();
    });
  });

  it("getPlayerRoleName", () => {
    let tagGameStore = new TagGameStore();
    tagGameStore.addPoliceUsers([userStore.getCurrentUser()]);
    let userRole = userStore.getPlayerRoleName(tagGameStore);
    expect(userRole).toBe("警察");

    tagGameStore = new TagGameStore();
    tagGameStore.addLiveThiefUsers([userStore.getCurrentUser()]);
    userRole = userStore.getPlayerRoleName(tagGameStore);
    expect(userRole).toBe("泥(生)");

    tagGameStore = new TagGameStore();
    tagGameStore.addRejectThiefUsers([userStore.getCurrentUser()]);
    userRole = userStore.getPlayerRoleName(tagGameStore);
    expect(userRole).toBe("泥(捕)");

    tagGameStore = new TagGameStore();
    expect(() => {
      userStore.getPlayerRoleName(tagGameStore);
    }).toThrow();
  });

  it("initialize", () => {
    userStore.initialize();
    expect(userStore.getCurrentUser().getId()).toBe("");
    expect(userStore.getCurrentUser().getName()).toBe("");
    expect(userStore.getCurrentUser().getDeviceId()).toBe("");
  });
});
