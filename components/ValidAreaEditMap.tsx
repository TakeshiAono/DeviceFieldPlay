import React from "react";
import Map, { Props } from "./Map";

export function ValidAreaEditMap({
  points,
  setPoints,
}: Omit<Props, "drawColor">) {
  return (
    <Map
      points={points}
      setPoints={setPoints}
      drawColor="rgba(50,200,50,0.2)"
    />
  );
}
