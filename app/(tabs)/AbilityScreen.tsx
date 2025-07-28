import { Colors } from "@/constants/Colors";
import {
  AbilityList,
  AbilityObject,
  ChangeToType,
} from "@/interfaces/abilities";
import TagGameStore from "@/stores/TagGameStore";
import UserStore, { RoleDisplayString } from "@/stores/UserStore";
import { getLocationsByPublisherId } from "@/utils/dynamoUtils";
import { getCurrentPositionAsync } from "expo-location";
import _ from "lodash";
import { inject, observer } from "mobx-react";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import "dayjs/locale/ja";

type Props = {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
};

export interface UpdateAbilityIsSettingParams {
  (
    abilityName: string,
    changeTo: ChangeToType,
    tagGameStore: TagGameStore,
  ): void;
}

const AbilityScreen: React.FC<Props> = ({ _userStore, _tagGameStore }) => {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;
  const abilityList: AbilityList = tagGameStore.getAbilityList;
  const [policeAbilities, thiefAbilities] = _.partition(
    abilityList,
    (abilityObject) => abilityObject.targetRole === "police",
  );

  const execRadarAbility = async (abilityObject: AbilityObject) => {
    const changeToCanUsedRuleMethod =
      tagGameStore.getExecChangeToCanUsedRuleMethod(abilityObject.abilityName);
    changeToCanUsedRuleMethod(abilityObject, tagGameStore);

    const location = await getCurrentPositionAsync({});
    const userLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    const publishId = userStore.getCurrentUser().getId();
    // ability()は戻り値がPromiseの場合とPromiseではない場合両方の可能性がある
    const ability = tagGameStore.getExecAbility(abilityObject.abilityName);
    await ability(
      abilityObject.abilityName,
      tagGameStore.getTagGame().getId(),
      userLocation,
      publishId,
    );

    // push通知が来たら各デバイスで自分の座標を取得してDynamoに保存する。
    // その際に時間がかかってしまうため、全ユーザー分の座標がDynamoに保存されるよう
    // 取得する処理発火までにバッファ時間を設けている。
    const bufferTime = 10000; // 10秒
    setTimeout(async () => {
      const locations = await getLocationsByPublisherId(
        publishId,
        abilityObject.abilityName,
      );
      const alertTitle = "レーダー検出結果";
      if ((locations.Count as number) > 0) {
        Alert.alert(
          alertTitle,
          `${locations.Count}人の捕まっていない泥棒が50m圏内に存在しているようです`,
        );
      } else {
        Alert.alert(
          alertTitle,
          `捕まっていない泥棒は50m圏内に存在していません`,
        );
      }
      tagGameStore.isLoading = false;
    }, bufferTime);
  };

  const renderButtons = () => {
    const selectedAbilitiesByRole =
      userStore.getPlayerRoleName(tagGameStore) === RoleDisplayString.policeUser
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
            tagGameStore.getAbilityState(abilityObject.abilityName).canUsed
              ? styles.validButton
              : styles.invalidButton
          }
          disabled={
            !tagGameStore.getAbilityState(abilityObject.abilityName).canUsed
          }
          onPress={async () => {
            try {
              // TODO: このswitch文いらないかも
              switch (abilityObject.abilityName) {
                case "radar":
                  tagGameStore.isLoading = true;
                  await execRadarAbility(abilityObject);
                  break;
                default:
                  break;
              }
            } catch (error) {
              console.log(`Error: ${error}`);
            }
          }}
        >
          <Text style={styles.buttonText}>レーダー</Text>
          {tagGameStore.getAbilityState("radar").reviveTime ? (
            <Text style={styles.buttonText}>
              {tagGameStore
                .getAbilityState("radar")
                .reviveTime?.add(1, "minutes")
                .format("HH:mm")}
              以降に復活
            </Text>
          ) : (
            <></>
          )}
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
