import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { inject, observer } from "mobx-react";
import TagGameStore from "@/stores/TagGameStore";
import AbilityCheckList, {
  AbilityTypeForList,
} from "@/components/AbilityCheckList";
import _ from "lodash";
import { AbilityObject } from "@/interfaces/abilities";
import { Colors } from "@/constants/Colors";
import { putTagGames } from "@/utils/dynamoUtils";

interface Props {
  _tagGameStore?: TagGameStore;
}

const AbilitySettingScreen: React.FC<Props> = ({ _tagGameStore }) => {
  const tagGameStore = _tagGameStore!;

  const [policeAbilitiesForList, setPoliceAbilitiesForList] = useState<
    AbilityTypeForList[]
  >([]);
  const [thiefAbilitiesForList, setThiefAbilitiesForList] = useState<
    AbilityTypeForList[]
  >([]);

  useEffect(() => {
    const [policeAbilities, thiefAbilities] = _.partition(
      tagGameStore.getTagGame().getAbilityList(),
      (abilityObject) => abilityObject.targetRole === "police",
    );
    setPoliceAbilitiesForList(transformToAbilitiesForList(policeAbilities));
    setThiefAbilitiesForList(transformToAbilitiesForList(thiefAbilities));
  }, []);

  const transformToAbilitiesForList = (
    abilities: AbilityObject[],
  ): AbilityTypeForList[] => {
    return abilities.map((ability) => ({
      abilityName: ability.abilityName,
      checked: ability.isSetting,
    }));
  };

  const onPoliceRecordClicked = (clickedAbilityRecord: AbilityTypeForList) => {
    setPoliceAbilitiesForList((prev) =>
      getChangedCheckedList(prev, clickedAbilityRecord.abilityName, true),
    );
  };

  const onPoliceRecordUnClicked = (
    clickedAbilityRecord: AbilityTypeForList,
  ) => {
    setPoliceAbilitiesForList((prev) =>
      getChangedCheckedList(prev, clickedAbilityRecord.abilityName, false),
    );
  };

  const onThiefRecordClicked = (clickedAbilityRecord: AbilityTypeForList) => {
    setThiefAbilitiesForList((prev) =>
      getChangedCheckedList(prev, clickedAbilityRecord.abilityName, true),
    );
  };

  const onThiefRecordUnClicked = (clickedAbilityRecord: AbilityTypeForList) => {
    setThiefAbilitiesForList((prev) =>
      getChangedCheckedList(prev, clickedAbilityRecord.abilityName, false),
    );
  };

  const getChangedCheckedList = (
    abilitiesForList: AbilityTypeForList[],
    targetAbilityName: string,
    afterCheckedValue: boolean,
  ) => {
    return abilitiesForList.map((abilityForList) => {
      if (abilityForList.abilityName === targetAbilityName) {
        return { ...abilityForList, checked: afterCheckedValue };
      } else {
        return abilityForList;
      }
    });
  };

  const updateAbilityList = () => {
    const [validPoliceAbilitiesForList, invalidPoliceAbilitiesForList] =
      _.partition(
        policeAbilitiesForList,
        (abilityForList) => abilityForList.checked === true,
      );
    const [validThiefAbilitiesForList, invalidThiefAbilitiesForList] =
      _.partition(
        thiefAbilitiesForList,
        (abilityForList) => abilityForList.checked === true,
      );

    const validAbilityForList = [
      ...validPoliceAbilitiesForList,
      ...validThiefAbilitiesForList,
    ];
    const invalidAbilityForList = [
      ...invalidPoliceAbilitiesForList,
      ...invalidThiefAbilitiesForList,
    ];

    const validAbilityNames = validAbilityForList.map(
      (abilityForList) => abilityForList.abilityName,
    );
    const invalidAbilityNames = invalidAbilityForList.map(
      (abilityForList) => abilityForList.abilityName,
    );

    tagGameStore.updateAbilityIsSettingParams(validAbilityNames, "toValid");
    tagGameStore.updateAbilityIsSettingParams(invalidAbilityNames, "toInvalid");
  };

  return (
    <View style={{ height: "100%", backgroundColor: "white" }}>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "white",
        }}
      >
        <View
          style={{
            flex: 1,
            height: "100%",
            justifyContent: "space-around",
          }}
        >
          <View style={{ marginHorizontal: "auto" }}>
            <Text style={{ alignItems: "center", fontSize: 20 }}>
              警察用アビリティ
            </Text>
          </View>
          <AbilityCheckList
            abilityRecords={policeAbilitiesForList}
            onChecked={onPoliceRecordClicked}
            onUnChecked={onPoliceRecordUnClicked}
          />
        </View>
        <View
          style={{
            flex: 1,
            height: "100%",
            justifyContent: "space-around",
          }}
        >
          <View style={{ marginHorizontal: "auto" }}>
            <Text style={{ alignItems: "center", fontSize: 20 }}>
              泥棒用アビリティ
            </Text>
          </View>
          <AbilityCheckList
            abilityRecords={thiefAbilitiesForList}
            onChecked={onThiefRecordClicked}
            onUnChecked={onThiefRecordUnClicked}
          />
        </View>
      </View>
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
        }}
      >
        <TouchableOpacity
          style={{
            height: 50,
            width: 150,
            backgroundColor: tagGameStore.getIsSetAbilityDone()
              ? Colors.success
              : Colors.error,
          }}
          onPress={async () => {
            updateAbilityList();
            await putTagGames(tagGameStore.getTagGame().toObject());
            tagGameStore.setIsSetAbilityDone(true);
          }}
        >
          <Text
            style={{
              textAlign: "center",
              marginVertical: "auto",
              fontSize: 15,
            }}
          >
            確定
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default inject("_tagGameStore")(observer(AbilitySettingScreen));
