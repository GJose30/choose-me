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

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default function Chat() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversations, setConversations] = useState([]); // <- aquí guardamos los chats
  const [loading, setLoading] = useState(true);

  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  // 1) Traer el id interno del usuario actual (tabla user) usando clerk_id
  const fetchCurrentUser = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const { data, error } = await supabase
      .from("user")
      .select("id, clerk_id")
      .eq("clerk_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error cargando usuario actual:", error.message);
      return;
    }

    if (!data) {
      console.warn("No existe fila en user para este clerk_id");
      return;
    }

    setCurrentUserId(data.id);
  }, [isLoaded, isSignedIn, user?.id]);

  // 2) Traer chats donde el usuario actual sea miembro
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);

    // 2.1) Obtener todos los chat_id donde participa el usuario
    const { data: memberships, error: mError } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("user_id", currentUserId);

    if (mError) {
      console.error("Error cargando memberships:", mError.message);
      setConversations([]);
      setLoading(false);
      return;
    }

    if (!memberships || memberships.length === 0) {
      // no hay chats aún
      setConversations([]);
      setLoading(false);
      return;
    }

    const chatIds = memberships.map((m) => m.chat_id);

    // 2.2) Obtener los chats con sus miembros y datos del usuario
    const { data: chats, error: cError } = await supabase
      .from("chats")
      .select(
        `
        id,
        type,
        chat_members (
          user_id,
          user:user (
            id,
            username,
            profile_pic
          )
        )
      `
      )
      .in("id", chatIds)
      .eq("type", "dm"); // solo chats de tipo dm

    if (cError) {
      console.error("Error cargando chats:", cError.message);
      setConversations([]);
      setLoading(false);
      return;
    }

    // 2.3) Normalizar: por cada chat, buscar el "otro" usuario (peer)
    const convos = (chats ?? [])
      .map((chat) => {
        const members = chat.chat_members || [];
        const other = members.find((m) => m.user_id !== currentUserId);

        if (!other || !other.user) return null;

        return {
          chatId: chat.id,
          peerUserId: other.user.id,
          peerUsername: other.user.username,
          peerAvatar: other.user.profile_pic,
        };
      })
      .filter(Boolean); // quitamos nulls

    setConversations(convos);
    setLoading(false);
  }, [currentUserId]);

  // 3) Efectos: primero obtener currentUserId, luego las conversaciones
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
    console.log(conversations.chatId);
  }, [currentUserId, fetchConversations, conversations.chatId]);

  const keyExtractor = useCallback((item) => String(item.chatId), []);

  // ... todo tu código igual arriba

  const renderItem = useCallback(
    ({ item }) => {
      const avatar = item.peerAvatar || FALLBACK_AVATAR;

      return (
        <Pressable
          className="flex-row items-center p-4 border-b border-gray-200"
          onPress={() => {
            router.push({
              pathname: "chatDetail/[id]",
              params: {
                userId: item?.chatId,
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
              {item.peerUsername}
            </Text>
            <Text className="text-gray-500" numberOfLines={1}>
              Toca para continuar el chat
            </Text>
          </View>
        </Pressable>
      );
    },
    [router]
  );

  // ... todo tu código igual abajo

  // const renderItem = useCallback(
  //   ({ item }) => {
  //     const avatar = item.peerAvatar || FALLBACK_AVATAR;

  //     return (
  //       <Pressable
  //         className="flex-row items-center p-4 border-b border-gray-200"
  //         onPress={() => {
  //           router.push({
  //             pathname: "chatDetail/[id]",
  //             params: {
  //               userId: item.peerUserId, // el otro usuario
  //               currentUserId, // usuario actual
  //               chatId: item.chatId, // ya sabemos el chat
  //               name: item.peerUsername,
  //               avatar,
  //             },
  //           });
  //         }}
  //       >
  //         <Image
  //           source={{ uri: avatar }}
  //           className="w-12 h-12 rounded-full mr-4"
  //         />

  //         <View className="flex-1">
  //           <Text className="font-bold text-gray-800 text-base">
  //             {item.peerUsername}
  //           </Text>

  //           <Text className="text-gray-500" numberOfLines={1}>
  //             Toca para continuar el chat
  //           </Text>
  //         </View>
  //       </Pressable>
  //     );
  //   },
  //   [router, currentUserId]
  // );

  // const renderItem = useCallback(
  //   ({ item }) => {
  //     const avatar = item.peerAvatar || FALLBACK_AVATAR;

  //     return (
  //       <Pressable
  //         className="flex-row items-center p-4 border-b border-gray-200"
  //         onPress={() => {
  //           router.push({
  //             pathname: "chatDetail/[id]",
  //             params: {
  //               id: item.chatId, // 👈 SOLO enviamos el chatId
  //             },
  //           });
  //         }}
  //       >
  //         <Image
  //           source={{ uri: avatar }}
  //           className="w-12 h-12 rounded-full mr-4"
  //         />

  //         <View className="flex-1">
  //           <Text className="font-bold text-gray-800 text-base">
  //             {item.peerUsername}
  //           </Text>

  //           <Text className="text-gray-500" numberOfLines={1}>
  //             Toca para continuar el chat
  //           </Text>
  //         </View>
  //       </Pressable>
  //     );
  //   },
  //   [router]
  // );

  // Mientras Clerk o el currentUserId no están listos, loader
  if (!isLoaded || !isSignedIn || !currentUserId) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-500">Preparando tus chats...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: "Mensajes",
        }}
      /> */}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-gray-500">Cargando chats...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">No tienes chats todavía.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}
