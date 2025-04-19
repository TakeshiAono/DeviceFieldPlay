import React from "react";
import Map, { Props } from "./Map";

export function PrisonAreaEditMap({
  points,
  setPoints,
}: Omit<Props, "drawColor">) {
  return (
    <Map points={points} setPoints={setPoints} drawColor="rgba(200,0,0,0.5)" />
  );
}
