import UserStore from "@/stores/UserStore";
import TagGameStore from "@/stores/TagGameStore";

describe("UserStoreユニットテスト", () => {
  const userStore = new UserStore();
  const userName = "testユーザー";

  it("setCurrentUserName", () => {
    userStore.setCurrentUserName(userName);
    expect(userStore.getCurrentUser().getName()).toBe(userName);
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
});
