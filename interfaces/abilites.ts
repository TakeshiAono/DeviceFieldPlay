export interface AbilityMethod {
  (args: unknown[]): void;
}

export interface ChangeToCanUsedRuleMethod {
  (args: unknown[]): void;
}

export type AbilityObject = {
  ability: AbilityMethod;
  abilityName: string;
  isSetting: boolean;
  canUsed: boolean; // trueの場合だけabilityが使用でき、falseの際は使用できない想定
  changeToCanUsedRuleMethod: ChangeToCanUsedRuleMethod;
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
  (abilityObject: AbilityObject): void;
}

/**
 * tagGameStoreでの定義
 * SettingScreenおよびAbilityScreenでの使用を想定
 *
 * AbilityScreen画面にてゲームユーザーがアビリティを実行する際の使用を想定
 */
export interface GetAbilityList {
  (): AbilityList;
}

// TODO: これ以下は詳細設計で必要なインタフェースなので各ファイルに定義してもよさそう
// /**
//  * tagGameStoreでの定義
//  * SettingScreenでの使用を想定
//  *
//  * 設定画面にてゲームマスターがゲーム中に使用できるアビリティを選択する際に使用する想定
//  */
// export interface UpdateAbilityIsSettingParams {
//   (abilityObject: AbilityObject): void;
// }

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
