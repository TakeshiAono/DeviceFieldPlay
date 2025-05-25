import { FlatList } from "react-native";
import { ListItem } from "@rneui/themed";

interface Props {
  userRecords: UserListItem[];
}

export type UserListItem = {
  id: string;
  name: string;
};

export default function UserList({ userRecords }: Props) {
  return (
    <FlatList
      data={userRecords}
      renderItem={({ item }) => {
        return (
          <ListItem>
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
