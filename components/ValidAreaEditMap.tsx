import React from "react";

import EditMap, { Props as EditProps } from "./EditMap";
import { MapAreaColors } from "@/constants/Colors";
import { inject, observer } from "mobx-react";
import UserStore from "@/stores/UserStore";
import TagGameStore from "@/stores/TagGameStore";

interface Props {
  _userStore?: UserStore;
  _tagGameStore?: TagGameStore;
}

function ValidAreaEditMap({
  points,
  setPoints,
  _userStore,
  _tagGameStore,
}: Omit<EditProps, "drawColor"> & Props) {
  const userStore = _userStore!;
  const tagGameStore = _tagGameStore!;

  return (
    <>
      <EditMap
        points={points}
        setPoints={setPoints}
        drawColor={MapAreaColors.validArea}
      />
    </>
  );
}

export default inject(
  "_userStore",
  "_tagGameStore",
)(observer(ValidAreaEditMap));
