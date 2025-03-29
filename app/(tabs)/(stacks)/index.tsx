import { SafeAreaView } from "react-native-safe-area-context";
import { inject, observer } from "mobx-react";

function SettingScreen() {

  return (
    <SafeAreaView>
    </SafeAreaView>
  );
}

export default inject("_userStore")(observer(SettingScreen));
