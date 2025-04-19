import React from "react";
import EditMap, { Props } from "./EditMap";
import { MapAreaColors } from "@/constants/Colors";

export function ValidAreaEditMap({
  points,
  setPoints,
}: Omit<Props, "drawColor">) {
  return (
    <EditMap
      points={points}
      setPoints={setPoints}
      drawColor={MapAreaColors.validArea}
    />
  );
}
