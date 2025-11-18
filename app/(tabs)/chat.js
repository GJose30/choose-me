import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";

// const CURRENT_USER_ID = "5c16bcb5-489c-465e-8f42-186c6fe9061f";
const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoaded, isSignedIn, user } = useUser();

  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("user")
      .select("id, username, profile_pic")
      .neq("clerk_id", user.id)
      // .neq("id", CURRENT_USER_ID)
      .order("username", { ascending: true });

    if (error) {
      console.error("Error cargando usuarios:", error.message);
      setUsers([]);
    } else {
      setUsers(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
    console.log(users.id);
  }, [fetchUsers]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderItem = useCallback(
    ({ item }) => {
      const avatar = item.profile_pic || FALLBACK_AVATAR;

      return (
        <Pressable
          className="flex-row items-center p-4 border-b border-gray-200"
          onPress={() => {
            router.push({
              pathname: "chatDetail/[id]",
              params: {
                id: item.id, // <- este será tu recipient_id
                name: item.username,
                avatar,
              },
            });
          }}
        >
          <Image
            source={{ uri: avatar }}
            className="w-12 h-12 rounded-full mr-4"
          />

          <View className="flex-1">
            <Text className="font-bold text-gray-800 text-base">
              {item.username}
            </Text>

            <Text className="text-gray-500" numberOfLines={1}>
              Toca para enviar un mensaje
            </Text>
          </View>
        </Pressable>
      );
    },
    [router]
  );

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: "Mensajes",
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-gray-500">Cargando usuarios...</Text>
        </View>
      ) : users.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">No hay usuarios disponibles.</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}
