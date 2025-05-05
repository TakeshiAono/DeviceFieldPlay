import { useEffect, useState } from "react";
import { inject, observer } from "mobx-react";
import { View } from "react-native";
import { TimerPickerModal } from "react-native-timer-picker";
import { Button } from "@rneui/themed";
import dayjs from "dayjs";

import TagGameStore from "@/stores/TagGameStore";

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
          <Button
            onPress={() => {
              setModalVisible(true);
            }}
          >
            ゲーム時間設定
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
            setSelectedDay(
              dayjs()
                .set("hour", pickedDuration.hours)
                .set("minute", pickedDuration.minutes)
                .set("second", pickedDuration.seconds),
            );
            setModalVisible(false);
          }}
          modalTitle="ゲーム終了時間"
          onCancel={() => {
            setModalVisible(false);
          }}
          closeOnOverlayPress
          confirmButtonText="設定"
          cancelButtonText="キャンセル"
        />
      </View>
    </View>
  );
}

export default inject("_userStore", "_tagGameStore")(observer(GameTimeScreen));
