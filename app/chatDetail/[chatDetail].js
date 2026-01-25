import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "../../lib/supabase";
import { Dots } from "../../components/Icon";
import { ChatDetailModal } from "../../components/Index/ChatDetailModal";
import { useFocusEffect } from "@react-navigation/native";

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
const FALLBACK_GROUP = "https://cdn-icons-png.flaticon.com/512/681/681494.png";

/* ---------- Helpers ---------- */
const isSameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const formatDayLabel = (iso) =>
  new Date(iso).toLocaleDateString("es-PA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("es-PA", {
    hour: "2-digit",
    minute: "2-digit",
  });

function DaySeparator({ label }) {
  return (
    <View className="items-center my-3">
      <View className="px-3 py-1 rounded-full bg-gray-100">
        <Text className="text-gray-500 text-xs font-semibold">{label}</Text>
      </View>
    </View>
  );
}

function MessageBubble({ message, isMe, showSender, sender }) {
  const senderName = (sender && sender.username) || "Usuario";
  const senderAvatar = (sender && sender.profile_pic) || FALLBACK_AVATAR;

  return (
    <View className={`mb-3 ${isMe ? "items-end" : "items-start"}`}>
      {showSender ? (
        <View
          className={`flex-row items-center mb-1 ${
            isMe ? "justify-end" : "justify-start"
          }`}
        >
          {isMe ? (
            <>
              <Text className="text-[12px] text-gray-500 mr-2">
                {senderName || "Tú"}
              </Text>
              <Image
                source={{ uri: senderAvatar }}
                className="w-6 h-6 rounded-full"
              />
            </>
          ) : (
            <>
              <Image
                source={{ uri: senderAvatar }}
                className="w-6 h-6 rounded-full mr-2"
              />
              <Text className="text-[12px] text-gray-500">{senderName}</Text>
            </>
          )}
        </View>
      ) : null}

      <View
        className="px-4 py-3 rounded-2xl max-w-[82%]"
        style={{ backgroundColor: isMe ? "#FEF3C7" : "#E0E7FF" }}
      >
        <Text className="text-gray-900">{message.text}</Text>
      </View>

      <Text className="text-[11px] text-gray-400 mt-1">
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
}

export default function ChatDetail() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const chatId = Array.isArray(userId) ? userId[0] : userId;

  const [chatType, setChatType] = useState("dm"); // "dm" | "group"
  const [groupCount, setGroupCount] = useState(0);

  const { user, isLoaded, isSignedIn } = useUser();

  // current user (tabla user)
  const [currentUser, setCurrentUser] = useState(null); // {id, username, profile_pic}

  const [peerUserId, setPeerUserId] = useState(null);
  const [peer, setPeer] = useState({
    username: "Chat",
    avatar: FALLBACK_AVATAR,
  });

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const listRef = useRef(null);

  // cache de perfiles por sender_id
  const [userMap, setUserMap] = useState({});
  const userMapRef = useRef({});
  useEffect(() => {
    userMapRef.current = userMap;
  }, [userMap]);

  /* ---------- Resolver current user (id, username, profile_pic) ---------- */
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    (async () => {
      const { data, error } = await supabase
        .from("user")
        .select("id, username, profile_pic")
        .eq("clerk_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("fetch current user:", error.message);
        return;
      }
      if (!data?.id) return;

      const me = {
        id: data.id,
        username: data.username || "Tú",
        profile_pic: data.profile_pic || FALLBACK_AVATAR,
      };

      setCurrentUser(me);

      // meterme en cache
      setUserMap((prev) => ({
        ...prev,
        [String(me.id)]: me,
      }));
    })();
  }, [isLoaded, isSignedIn, user?.id]);

  /* ---------- Cargar perfiles faltantes por ids ---------- */
  const loadUsersByIds = useCallback(async (ids) => {
    const unique = Array.from(new Set((ids || []).map(String))).filter(Boolean);

    const cache = userMapRef.current || {};
    const missing = unique.filter((id) => !cache[id]);

    if (!missing.length) return;

    const { data, error } = await supabase
      .from("user")
      .select("id, username, profile_pic")
      .in("id", missing);

    if (error) {
      console.error("loadUsersByIds error:", error.message);
      return;
    }

    if (!data?.length) return;

    setUserMap((prev) => {
      const next = { ...prev };
      for (const u of data) {
        next[String(u.id)] = {
          id: u.id,
          username: u.username || "Usuario",
          profile_pic: u.profile_pic || FALLBACK_AVATAR,
        };
      }
      return next;
    });
  }, []);

  const ensureSenderLoaded = useCallback(async (senderId) => {
    const id = String(senderId);
    if (!id) return;

    const cache = userMapRef.current || {};
    if (cache[id]) return;

    const { data, error } = await supabase
      .from("user")
      .select("id, username, profile_pic")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("ensureSenderLoaded error:", error.message);
      return;
    }
    if (!data?.id) return;

    setUserMap((prev) => ({
      ...prev,
      [id]: {
        id: data.id,
        username: data.username || "Usuario",
        profile_pic: data.profile_pic || FALLBACK_AVATAR,
      },
    }));
  }, []);

  /* ---------- Header dm/group ---------- */
  const loadHeader = useCallback(async () => {
    if (!chatId || !currentUser?.id) return;

    const { data: chatRow, error: chatErr } = await supabase
      .from("chats")
      .select("id,type")
      .eq("id", chatId)
      .maybeSingle();

    if (chatErr) {
      console.error("fetch chat type:", chatErr.message);
      return;
    }

    const type = chatRow?.type || "dm";
    setChatType(type);

    if (type === "dm") {
      const { data, error } = await supabase
        .from("chat_members")
        .select("user_id, user:user_id(id,username,profile_pic)")
        .eq("chat_id", chatId)
        .neq("user_id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("fetch peer dm:", error.message);
        return;
      }

      if (data?.user) {
        setPeer({
          username: data.user.username || "Chat",
          avatar: data.user.profile_pic || FALLBACK_AVATAR,
        });
        setPeerUserId(data.user.id);
      } else {
        setPeer({ username: "Chat", avatar: FALLBACK_AVATAR });
        setPeerUserId(null);
      }

      setGroupCount(0);
      return;
    }

    const { data: members, error: memErr } = await supabase
      .from("chat_members")
      .select("user_id")
      .eq("chat_id", chatId);

    if (memErr) console.error("fetch members group:", memErr.message);

    const count = (members || []).length;
    setGroupCount(count);

    const { data: groupInfo, error: groupErr } = await supabase
      .from("chat_groups")
      .select("title, avatar")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (groupErr) console.error("fetch group info:", groupErr.message);

    setPeer({
      username: groupInfo?.title || `Grupo (${count})`,
      avatar: groupInfo?.avatar || FALLBACK_GROUP,
    });

    setPeerUserId(null);
  }, [chatId, currentUser?.id]);

  useEffect(() => {
    loadHeader();
  }, [loadHeader]);

  useFocusEffect(
    useCallback(() => {
      loadHeader();
    }, [loadHeader])
  );

  /* ---------- Realtime: chat_groups ---------- */
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`rt-chat-groups-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_groups",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          setPeer((prev) => ({
            ...prev,
            username: row.title || prev.username,
            avatar: row.avatar || prev.avatar,
          }));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId]);

  /* ---------- Realtime: chat_members ---------- */
  useEffect(() => {
    if (!chatId || chatType !== "group") return;

    const channel = supabase
      .channel(`rt-chat-members-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_members",
          filter: `chat_id=eq.${chatId}`,
        },
        async () => {
          const { data, error } = await supabase
            .from("chat_members")
            .select("user_id")
            .eq("chat_id", chatId);

          if (!error) setGroupCount((data || []).length);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId, chatType]);

  /* ---------- Load messages + realtime ---------- */
  useEffect(() => {
    if (!chatId) return;

    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) console.error("fetch messages:", error.message);

      const rows = data || [];
      setMessages(rows);
      setLoading(false);

      await loadUsersByIds(rows.map((m) => m.sender_id));

      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset?.({ offset: 0, animated: false });
      });
    })();

    const channel = supabase
      .channel(`rt-chat-messages-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        async (p) => {
          const incoming = p.new;

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });

          await ensureSenderLoaded(incoming.sender_id);

          requestAnimationFrame(() => {
            listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId, loadUsersByIds, ensureSenderLoaded]);

  /* ---------- Items con separadores (reversed porque usas inverted) ---------- */
  const chatItems = useMemo(() => {
    const out = [];
    let last = null;

    for (const m of messages) {
      if (!last || !isSameDay(last, m.created_at)) {
        out.push({
          id: `day-${m.created_at}`,
          type: "day",
          label: formatDayLabel(m.created_at),
        });
        last = m.created_at;
      }
      out.push({ id: m.id, type: "msg", message: m });
    }

    return out.reverse();
  }, [messages]);

  /* ✅ REGLA CORRECTA:
     En grupos: mostrar nombre/foto SOLO si el mensaje más viejo anterior
     (index+1, saltando separadores) NO es del mismo sender_id. */
  const shouldShowSenderForItem = useCallback(
    (index) => {
      if (chatType !== "group") return false;

      const cur = chatItems[index];
      if (!cur || cur.type !== "msg") return false;

      // buscar el mensaje "más viejo" inmediato (por reverse + inverted)
      for (let i = index + 1; i < chatItems.length; i++) {
        const it = chatItems[i];
        if (!it) continue;

        // si cambia el día, mostramos sender en el primero del día
        if (it.type === "day") return true;

        if (it.type === "msg") {
          const olderMsg = it.message;
          const sameSender =
            String(cur.message.sender_id) === String(olderMsg.sender_id);

          // si es el mismo usuario que venía escribiendo, no mostramos
          return !sameSender;
        }
      }

      // no hay msg más viejo => es el primero del chat => mostrar
      return true;
    },
    [chatType, chatItems]
  );

  const renderItem = ({ item, index }) => {
    if (item.type === "day") return <DaySeparator label={item.label} />;

    const msg = item.message;
    const isMe = String(msg.sender_id) === String(currentUser?.id);
    const sender = userMap[String(msg.sender_id)] || null;

    return (
      <MessageBubble
        message={msg}
        isMe={isMe}
        showSender={shouldShowSenderForItem(index)}
        sender={sender}
      />
    );
  };

  /* ---------- Send ---------- */
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser?.id || !chatId) return;

    const text = newMessage.trim();
    setNewMessage("");

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      chat_id: chatId,
      sender_id: currentUser.id,
      text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
    });

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ chat_id: chatId, sender_id: currentUser.id, text })
      .select("*")
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              onPress={() => {
                if (chatType === "dm") {
                  if (!peerUserId) return;
                  router.push({
                    pathname: "indexScreens/profile/[id]",
                    params: { index: peerUserId },
                  });
                  return;
                }

                router.push({
                  pathname: "chatDetail/groupInfo",
                  params: { id: chatId },
                });
              }}
              className="flex-row items-center"
            >
              <Image
                source={{ uri: peer.avatar || FALLBACK_AVATAR }}
                className="w-9 h-9 rounded-full mr-2"
              />
              <View>
                <Text className="text-gray-800 font-semibold text-[16px]">
                  {peer.username}
                </Text>
                {chatType === "group" ? (
                  <Text className="text-gray-400 text-[12px]">
                    {groupCount} miembro(s)
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => setModalVisible(true)}>
              <Dots size={24} />
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <ActivityIndicator className="mt-10" />
      ) : (
        <FlatList
          ref={listRef}
          inverted
          data={chatItems}
          renderItem={renderItem}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View className="px-4 pb-3 pt-2 border-t border-gray-200">
        <View className="flex-row bg-gray-100 rounded-2xl px-3 py-2">
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            className="flex-1"
            multiline
          />
          <Pressable onPress={sendMessage}>
            <Text className="text-indigo-600 font-bold px-2">Enviar</Text>
          </Pressable>
        </View>
      </View>

      <ChatDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
