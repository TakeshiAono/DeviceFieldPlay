import { Colors } from "@/constants/Colors";
import {
  AbilityList,
  AbilityObject,
  ChangeToType,
  UpdateAbilityUsedParams,
} from "@/interfaces/abilities";
import TagGameStore from "@/stores/TagGameStore";
import UserStore, { RoleDisplayString } from "@/stores/UserStore";
import _ from "lodash";
import { inject, observer } from "mobx-react";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
};

export interface UpdateAbilityIsSettingParams {
  (abilityName: string, changeTo: ChangeToType): void;
}

const AbilityScreen: React.FC<Props> = ({ _userStore, _tagGameStore }) => {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;
  const abilityList: AbilityList = tagGameStore.getAbilityList();
  const [policeAbilities, thiefAbilities] = _.partition(
    abilityList,
    (abilityObject) => abilityObject.targetRole === "police",
  );

  const changeAbilityCanUsed: UpdateAbilityIsSettingParams = (
    targetAbility: string,
    changeTo: ChangeToType,
  ) => {
    tagGameStore.updateAbilityUsedParams(targetAbility, changeTo);
  };

  const renderButtons = () => {
    const selectedAbilitiesByRole =
      userStore.getPlayerRoleName(tagGameStore) === "police"
        ? policeAbilities
        : thiefAbilities;
    const settingAbilities = selectedAbilitiesByRole.filter(
      (abilityObject) => abilityObject.isSetting,
    );

    return settingAbilities.map((abilityObject) => {
      return (
        <TouchableOpacity
          key={abilityObject.abilityName}
          style={
            abilityObject.canUsed ? styles.validButton : styles.invalidButton
          }
          disabled={!abilityObject.canUsed}
          onPress={async () => {
            await abilityObject.ability();
            changeAbilityCanUsed(abilityObject.abilityName, "toInvalid");
          }}
        >
          <Text style={styles.buttonText}>{abilityObject.abilityName}</Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <View
      style={{
        flex: 1,
        height: "100%",
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: "white",
      }}
    >
      {renderButtons()}
    </View>
  );
};

const baseButtonStyle = {
  height: 50,
  width: 150,
  borderRadius: 5,
};

const styles = StyleSheet.create({
  validButton: {
    ...baseButtonStyle,
    backgroundColor: Colors.primary,
  },
  invalidButton: {
    ...baseButtonStyle,
    backgroundColor: Colors.inactive,
  },
  buttonText: {
    color: "black",
    textAlign: "center",
    marginVertical: "auto",
    fontSize: 15,
  },
});

export default inject("_userStore", "_tagGameStore")(observer(AbilityScreen));
