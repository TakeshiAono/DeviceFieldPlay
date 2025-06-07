import { useEffect, useState } from "react";
import { inject, observer } from "mobx-react";
import { Alert, Text, View } from "react-native";
import { TimerPickerModal } from "react-native-timer-picker";
import { Button } from "@rneui/themed";
import dayjs from "dayjs";
import i18next from "i18next";

import TagGameStore from "@/stores/TagGameStore";
import { router } from "expo-router";

interface Props {
  _tagGameStore?: TagGameStore;
}

function GameTimeScreen({ _tagGameStore }: Props) {
  const tagGameStore = _tagGameStore!;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(
    tagGameStore.getTagGame().getGameTimeLimit() ?? dayjs(),
  );

  useEffect(() => {
    if (tagGameStore.getShouldShowGameExplanation()) {
      Alert.alert(i18next.t("Game End Time Setting Method"), i18next.t("Please set the end time for the game"));
    }
  }, []);

  useEffect(() => {
    if (selectedDay.isAfter(dayjs(), "minute")) {
      tagGameStore.getTagGame().setGameTimeLimit(selectedDay);
    } else {
      tagGameStore.getTagGame().resetGameTimeLimit();
    }
  }, [selectedDay]);

  return (
    <View
      style={{
        backgroundColor: "white",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View>
          <Text style={{ color: "red" }}>
            {selectedDay?.isBefore(dayjs(), "minute") &&
              "過去の時間になっています"}
          </Text>
          <Button
            onPress={() => {
              setModalVisible(true);
            }}
          >
            {i18next.t("Game Time Setting")}
          </Button>
        </View>
        <TimerPickerModal
          initialValue={{
            hours: selectedDay.hour(),
            minutes: selectedDay.minute(),
            seconds: 0,
          }}
          hideSeconds={true}
          visible={modalVisible}
          setIsVisible={setModalVisible}
          onConfirm={(pickedDuration) => {
            if (tagGameStore.getShouldShowGameExplanation()) {
              // NOTE: /(tabs)/ThiefListScreenに遷移だけでは設定タブに移動した際にタイムリミット画面のままで設定画面に戻るボタンが存在しないため
              // stackの設定画面に一瞬移動させている。
              router.replace("/(tabs)/(stacks)");

              router.replace("/(tabs)/ThiefListScreen");
            }

            setSelectedDay(
              dayjs()
                .set("hour", pickedDuration.hours)
                .set("minute", pickedDuration.minutes)
                .set("second", pickedDuration.seconds),
            );
            setModalVisible(false);
          }}
          modalTitle={i18next.t("Game End Time")}
          onCancel={() => {
            setModalVisible(false);
          }}
          closeOnOverlayPress
          confirmButtonText={i18next.t("Set")}
          cancelButtonText={i18next.t("Cancel")}
        />
      </View>
    </View>
  );
}

export default inject("_userStore", "_tagGameStore")(observer(GameTimeScreen));
