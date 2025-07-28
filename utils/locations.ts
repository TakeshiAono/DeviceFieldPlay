import { getCurrentPositionAsync } from "expo-location";
import { getDistance } from "geolib";
import { LatLng } from "react-native-maps";

export const getCurrentLocation = async () => {
  const location = await getCurrentPositionAsync({});
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};

export const isWithinDistance = (
  centerLocation: LatLng,
  targetLocation: LatLng,
  upperLimitDistance: number,
) => {
  const distance = getDistance(centerLocation, targetLocation);
  return distance < upperLimitDistance;
};
