import { FlatList } from "react-native";
import { ListItem } from "@rneui/themed";

interface Props {
  userRecords: UserTypeForList[];
  onChecked: (userRecord: UserTypeForList) => void;
  onUnChecked: (userRecord: UserTypeForList) => void;
}

export type UserTypeForList = {
  id: string;
  name: string;
  checked: boolean;
};

export default function UserCheckList({
  userRecords,
  onChecked,
  onUnChecked,
}: Props) {
  const pressHandler = (item: UserTypeForList) => {
    const beforeChangeCheckedProp = item.checked;
    beforeChangeCheckedProp
      ? onUnChecked({ ...item, checked: !item.checked })
      : onChecked({ ...item, checked: !item.checked });
  };

  return (
    <FlatList
      data={userRecords}
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
              <ListItem.Title>{item.name}</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        );
      }}
      keyExtractor={(item) => item.id}
    />
  );
}
