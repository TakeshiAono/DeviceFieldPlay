import {
  AbilityMethod,
  AbilityObject,
  ChangeToCanUsedRuleMethod,
  ChangeToType,
  UpdateAbilityIsSettingParams,
} from "@/interfaces/abilities";
import { publishRequestForRadarRequest } from "./api";
import { LatLng } from "react-native-maps";
import TagGameStore from "@/stores/TagGameStore";
import dayjs from "dayjs";

export const triggerRadarAbility: AbilityMethod = async (
  abilityName,
  gameId,
  currentPosition,
  publisherId,
) => {
  await publishRequestForRadarRequest(
    abilityName as string,
    gameId as string,
    currentPosition as LatLng,
    publisherId as string,
  );
  return;
};

export const canUsedRuleOfRadarAbility: ChangeToCanUsedRuleMethod = async (
  _abilityObject,
  _tagGameStore,
) => {
  const abilityObject = _abilityObject as AbilityObject;
  const tagGameStore = _tagGameStore as TagGameStore;

  changeAbilityCanUsed(abilityObject.abilityName, "toInvalid", tagGameStore);

  const reviveMinutes = 1; //1分
  tagGameStore.updateAbilityReviveTimeParams(
    abilityObject.abilityName,
    dayjs().add(reviveMinutes, "minute"),
  );
  setTimeout(
    () => {
      changeAbilityCanUsed(abilityObject.abilityName, "toValid", tagGameStore);
      tagGameStore.updateAbilityReviveTimeParams(
        abilityObject.abilityName,
        null,
      );
    },
    reviveMinutes * (1000 * 60),
  );
};

export const changeAbilityCanUsed: UpdateAbilityIsSettingParams = (
  targetAbility: string,
  changeTo: ChangeToType,
  tagGameStore: TagGameStore,
) => {
  tagGameStore.updateAbilityUsedParams(targetAbility, changeTo);
  return;
};
