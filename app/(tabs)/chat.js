import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
const FALLBACK_GROUP = "https://cdn-icons-png.flaticon.com/512/681/681494.png";

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function Chat() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [myChatIds, setMyChatIds] = useState([]); // ✅ para suscripciones
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const channelsRef = useRef([]);

  const fetchCurrentUser = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const { data, error } = await supabase
      .from("user")
      .select("id")
      .eq("clerk_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error cargando usuario actual:", error.message);
      return;
    }

    if (!data?.id) {
      console.warn("No existe fila en user para este clerk_id");
      return;
    }

    setCurrentUserId(String(data.id));
  }, [isLoaded, isSignedIn, user?.id]);

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);

    // memberships
    const { data: memberships, error: mError } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("user_id", currentUserId);

    if (mError) {
      console.error("Error cargando memberships:", mError.message);
      setConversations([]);
      setMyChatIds([]);
      setLoading(false);
      return;
    }

    if (!memberships?.length) {
      setConversations([]);
      setMyChatIds([]);
      setLoading(false);
      return;
    }

    const chatIds = memberships.map((m) => m.chat_id);
    setMyChatIds(chatIds);

    // chats + members
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
      .in("id", chatIds);

    if (cError) {
      console.error("Error cargando chats:", cError.message);
      setConversations([]);
      setLoading(false);
      return;
    }

    // groups info
    const groupIds = (chats || [])
      .filter((c) => c.type === "group")
      .map((c) => c.id);

    let groupByChatId = {};
    if (groupIds.length > 0) {
      const { data: groups, error: gError } = await supabase
        .from("chat_groups")
        .select("chat_id, title, avatar")
        .in("chat_id", groupIds);

      if (gError) console.error("Error cargando chat_groups:", gError.message);
      (groups || []).forEach((g) => {
        groupByChatId[String(g.chat_id)] = g;
      });
    }

    // last messages
    const { data: lastMsgs, error: lmError } = await supabase
      .from("chat_messages")
      .select("chat_id, text, created_at")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: false });

    if (lmError)
      console.error("Error cargando últimos mensajes:", lmError.message);

    const lastByChat = {};
    (lastMsgs || []).forEach((m) => {
      if (!lastByChat[m.chat_id]) lastByChat[m.chat_id] = m;
    });

    const convos = (chats || [])
      .map((chat) => {
        const members = chat.chat_members || [];
        const last = lastByChat[chat.id];

        if (chat.type === "dm") {
          const other = members.find(
            (m) => String(m.user_id) !== String(currentUserId)
          );
          if (!other?.user) return null;

          return {
            chatId: chat.id,
            type: "dm",
            title: other.user.username || "Chat",
            avatar: other.user.profile_pic || FALLBACK_AVATAR,
            lastText: last?.text || "Toca para continuar el chat",
            lastAt: last?.created_at || null,
            unreadCount: 0,
          };
        }

        const g = groupByChatId[String(chat.id)];
        return {
          chatId: chat.id,
          type: "group",
          title: g?.title || `Grupo (${members.length})`,
          avatar: g?.avatar || FALLBACK_GROUP,
          lastText: last?.text || "Grupo creado",
          lastAt: last?.created_at || null,
          unreadCount: 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
        const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
        return tb - ta;
      });

    setConversations(convos);
    setLoading(false);
  }, [currentUserId]);

  // Init
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (currentUserId) fetchConversations();
  }, [currentUserId, fetchConversations]);

  // ✅ auto-refresh al volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      if (currentUserId) fetchConversations();
    }, [currentUserId, fetchConversations])
  );

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchConversations();
    } finally {
      setRefreshing(false);
    }
  }, [fetchConversations]);

  // ✅ Realtime: actualizar title/avatar de grupos en la lista
  useEffect(() => {
    // limpia canales previos
    channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
    channelsRef.current = [];

    if (!myChatIds.length) return;

    // solo grupos (para no abrir canales innecesarios)
    const groupChatIds = conversations
      .filter((c) => c.type === "group")
      .map((c) => c.chatId);

    if (!groupChatIds.length) return;

    const channels = groupChatIds.map((id) =>
      supabase
        .channel(`rt-chatlist-groups-${id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_groups",
            filter: `chat_id=eq.${id}`,
          },
          (payload) => {
            const g = payload.new;
            if (!g) return;

            setConversations((prev) =>
              prev.map((c) =>
                String(c.chatId) === String(g.chat_id)
                  ? {
                      ...c,
                      title: g.title ?? c.title,
                      avatar: g.avatar ?? c.avatar,
                    }
                  : c
              )
            );
          }
        )
        .subscribe()
    );

    channelsRef.current = channels;

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [myChatIds, conversations]);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.title || "").toLowerCase().includes(q)
    );
  }, [query, conversations]);

  const keyExtractor = useCallback((item) => String(item.chatId), []);
  const renderItem = useCallback(
    ({ item }) => {
      return (
        <Pressable
          className="flex-row items-center px-4 py-3 border-b border-gray-100"
          onPress={() => {
            router.push({
              pathname: "chatDetail/[id]",
              params: { userId: item.chatId },
            });
          }}
        >
          <Image
            source={{ uri: item.avatar || FALLBACK_AVATAR }}
            className="w-12 h-12 rounded-full mr-3"
          />

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-gray-900" numberOfLines={1}>
                {item.title}
              </Text>

              <Text className="text-xs text-gray-400 ml-3">
                {formatTime(item.lastAt)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-gray-500 flex-1" numberOfLines={1}>
                {item.lastText}
              </Text>

              {item.unreadCount > 0 ? (
                <View className="ml-3 bg-[#FE9B5C] rounded-full px-2 py-[2px]">
                  <Text className="text-white text-xs font-semibold">
                    {item.unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      );
    },
    [router]
  );

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
      <Stack.Screen
        options={{
          headerTitle: "Mensajes",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "white" },
        }}
      />

      {/* Search */}
      <View className="px-4 pt-3 pb-2">
        <View className="bg-gray-100 rounded-2xl px-4 py-3 flex-row items-center">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar chats..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-base text-gray-900"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {!!query && (
            <Pressable onPress={() => setQuery("")} className="ml-2 px-2 py-1">
              <Text className="text-gray-500 text-sm">Limpiar</Text>
            </Pressable>
          )}
        </View>

        <Text className="text-xs text-gray-400 mt-2">
          {filteredConversations.length} conversación(es)
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-gray-500">Cargando chats...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-gray-800 font-semibold text-lg">
            No hay resultados
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            {query.trim()
              ? "No encontramos chats que coincidan con tu búsqueda."
              : "Aún no tienes chats. Escribe a alguien desde su perfil."}
          </Text>

          {!!query && (
            <Pressable
              onPress={() => setQuery("")}
              className="mt-4 bg-[#FE9B5C] px-5 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Ver todos</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}
