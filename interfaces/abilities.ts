import TagGameStore, { AbilityNames } from "@/stores/TagGameStore";

export interface AbilityMethod {
  (...args: unknown[]): Promise<void> | void;
}

export interface ChangeToCanUsedRuleMethod {
  (...args: unknown[]): Promise<void> | void;
}

export type AbilityObject = {
  abilityName: AbilityNames;
  isSetting: boolean;
  targetRole: "thief" | "police";
};

export type AbilityList = AbilityObject[];

/**
 * tagGameStoreでの定義
 * AbilityScreenでの使用を想定
 *
 * AbilityScreen画面にてアビリティを実行した際の使用を想定
 */
export interface UpdateAbilityUsedParams {
  updateCanUsedOfAbilityState(
    targetAbilityName: string,
    changeTo: ChangeToType,
  ): void;
}

export type ChangeToType = "toValid" | "toInvalid";

export type UpdateAbilityIsSettingParams = (
  targetAbilityName: AbilityNames,
  changeTo: ChangeToType,
  tagGameStore: TagGameStore,
) => void;
/**
 * tagGameStoreでの定義
 * SettingScreenおよびAbilityScreenでの使用を想定
 *
 * AbilityScreen画面にてゲームユーザーがアビリティを実行する際の使用を想定
 */
export interface GetAbilityList {
  getAbilityList: AbilityList;
}

// TODO: これ以下は詳細設計で必要なインタフェースなので各ファイルに定義してもよさそう
// /**
//  * SettingScreenでの定義と使用を想定
//  *
//  * イベントをキャッチした時にCanUsedパラメータをtrue(有効)にするためのメソッド
//  */
// export interface ExecChangeToCanUsedRuleMethod {
//   (abilityObject: AbilityObject): void;
// }

// /**
//  * SettingScreenでの使用を想定
//  *
//  * 予定の時間が過ぎた時やある条件を満たした時などの
//  * イベントをキャッチしてExecChangeToCanUsedRuleMethodを発火するためのイベントリスナー用
//  */
// export interface ExecChangeToCanUsedRuleMethodEventListener {
//   (
//     event: Event,
//     execChangeToEnableRuleMethod: ExecChangeToCanUsedRuleMethod,
//   ): void;
// }
