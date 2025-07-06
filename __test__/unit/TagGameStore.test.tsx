import TagGameStore from "@/stores/TagGameStore";
import TagGameModel, { InitialParamsType } from "@/models/TagGameModel";

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
});
