import { LatLng } from "react-native-maps";
import axios from "axios";

import { DynamoTagGame, ExecDistanceForRadarRequest } from "@/interfaces/api";
import { Props as UserProps } from "@/models/UserModel";

export const publishRequestForRadarRequest: ExecDistanceForRadarRequest =
  async (
    gameId: DynamoTagGame["id"],
    currentPosition: LatLng,
    publisherId: UserProps["id"],
  ) => {
    axios
      .post("https://8hrls8krwd.execute-api.us-west-2.amazonaws.com/ability", {
        gameId: gameId,
        currentPosition: currentPosition,
        publisherId: publisherId,
        abilityType: "radar",
      })
      .catch((e) => {
        console.log("Error: ", e);
      });

    return;
  };
