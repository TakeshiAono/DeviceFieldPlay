import { FlatList } from "react-native";
import { ListItem } from "@rneui/themed";

interface Props {
  abilityRecords: AbilityTypeForList[];
  onChecked: (userRecord: AbilityTypeForList) => void;
  onUnChecked: (userRecord: AbilityTypeForList) => void;
}

export type AbilityTypeForList = {
  abilityName: string;
  checked: boolean;
};

export default function AbilityCheckList({
  abilityRecords,
  onChecked,
  onUnChecked,
}: Props) {
  const pressHandler = (item: AbilityTypeForList) => {
    const beforeChangeCheckedProp = item.checked;
    beforeChangeCheckedProp
      ? onUnChecked({ ...item, checked: !item.checked })
      : onChecked({ ...item, checked: !item.checked });
  };

  return (
    <FlatList
      data={abilityRecords}
      renderItem={({ item }) => {
        return (
          <ListItem
            onPress={() => {
              pressHandler(item);
            }}
          >
            <ListItem.CheckBox
              checked={item.checked}
              onPress={() => {
                pressHandler(item);
              }}
            />
            <ListItem.Content>
              <ListItem.Title>{item.abilityName}</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        );
      }}
      keyExtractor={(item) => item.abilityName}
    />
  );
}
