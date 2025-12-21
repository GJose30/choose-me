// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   Pressable,
//   KeyboardAvoidingView,
//   Platform,
//   Image,
//   ActivityIndicator,
// } from "react-native";
// import { Dots } from "../../components/Icon";
// import { Stack, useLocalSearchParams, useRouter } from "expo-router";
// import { useUser } from "@clerk/clerk-expo";
// import { supabase } from "../../lib/supabase";
// import { ChatDetailModal } from "../../components/Index/ChatDetailModal";

// export default function ChatDetail() {
//   const [chatOptionsVisible, setChatOptionsVisible] = useState(false);
//   const params = useLocalSearchParams();

//   // Aceptamos tanto id como userId por si la ruta viene distinta
//   const { userId, name, avatar, time, currentUserId } = params || {};

//   const rawPeerId = userId;
//   const peerUserId = Array.isArray(rawPeerId) ? rawPeerId[0] : rawPeerId;

//   const { isLoaded, isSignedIn, user } = useUser();

//   // const [currentUserId, setCurrentUserId] = useState(null); // id interno tabla user
//   const router = useRouter();
//   const [chatId, setChatId] = useState(null); // id de la tabla chats
//   const [messages, setMessages] = useState([]);
//   const [loadingMessages, setLoadingMessages] = useState(true);
//   const [newMessage, setNewMessage] = useState("");
//   const [sending, setSending] = useState(false);

//   const headerTitle = name || "Chat";

//   // 2) Asegurar que existe un chat (dm) entre currentUserId y peerUserId
//   const ensureChat = useCallback(async () => {
//     // Traer todos los chats dm con sus miembros
//     const { data, error } = await supabase
//       .from("chats")
//       .select("id, type, chat_members ( user_id )")
//       .eq("type", "dm");

//     if (error) {
//       console.error("❌ Error buscando chats:", error.message);
//       return;
//     }

//     let foundChatId = null;

//     if (data) {
//       for (const chat of data) {
//         const memberIds = (chat.chat_members || []).map((m) => m.user_id);
//         const hasCurrent = memberIds.includes(currentUserId);
//         const hasPeer = memberIds.includes(peerUserId);
//         if (hasCurrent && hasPeer) {
//           foundChatId = chat.id;
//           break;
//         }
//       }
//     }

//     if (foundChatId) {
//       // console.log("✅ Chat existente encontrado:", foundChatId);
//       setChatId(foundChatId);
//       return;
//     }

//     // Si no existe, lo creamos
//     // console.log("➕ Creando nuevo chat dm");

//     const { data: newChat, error: chatError } = await supabase
//       .from("chats")
//       .insert({
//         type: "dm",
//         created_by: currentUserId,
//       })
//       .select("id")
//       .maybeSingle();

//     if (chatError || !newChat) {
//       console.error("❌ Error creando chat:", chatError?.message);
//       return;
//     }

//     const newChatId = newChat.id;

//     // Insertar miembros
//     const { error: membersError } = await supabase.from("chat_members").insert([
//       {
//         chat_id: newChatId,
//         user_id: currentUserId,
//         role: "owner",
//         joined_at: new Date().toISOString(),
//       },
//       {
//         chat_id: newChatId,
//         user_id: peerUserId,
//         role: "member",
//         joined_at: new Date().toISOString(),
//       },
//     ]);

//     if (membersError) {
//       console.error("❌ Error insertando miembros:", membersError.message);
//       return;
//     }

//     setChatId(newChatId);
//   }, [currentUserId, peerUserId]);

//   useEffect(() => {
//     ensureChat();
//   }, [ensureChat]);

//   // 3) Cargar mensajes del chat cuando ya tenemos chatId
//   const fetchMessages = useCallback(async () => {
//     setLoadingMessages(true);

//     const { data, error } = await supabase
//       .from("chat_messages")
//       .select("*")
//       .eq("chat_id", chatId)
//       .order("created_at", { ascending: false });

//     if (error) {
//       console.error("❌ Error fetching messages:", error.message);
//       setLoadingMessages(false);
//       return;
//     }

//     setMessages(data || []);
//     setLoadingMessages(false);
//   }, [chatId]);

//   useEffect(() => {
//     if (chatId) {
//       fetchMessages();
//     }
//   }, [chatId, fetchMessages]);

//   // 4) Realtime para ese chat
//   useEffect(() => {
//     if (!chatId) return;

//     const channel = supabase
//       .channel(`chat-messages-${chatId}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "chat_messages",
//           filter: `chat_id=eq.${chatId}`,
//         },
//         (payload) => {
//           setMessages((prev) => [payload.new, ...prev]);
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [chatId]);

//   // 5) Enviar mensaje
//   const sendMessage = useCallback(async () => {
//     if (!newMessage.trim()) return;

//     const text = newMessage.trim();
//     setNewMessage("");
//     setSending(true);

//     const tempId = `temp-${Date.now()}`;
//     const optimisticMessage = {
//       id: tempId,
//       text,
//       chat_id: chatId,
//       sender_id: currentUserId,
//       created_at: new Date().toISOString(),
//     };

//     setMessages((prev) => [optimisticMessage, ...prev]);

//     const { data, error } = await supabase
//       .from("chat_messages")
//       .insert({
//         chat_id: chatId,
//         sender_id: currentUserId,
//         text,
//       })
//       .select("*")
//       .maybeSingle();

//     setSending(false);

//     if (error) {
//       console.error("❌ Error insertando mensaje:", error.message);
//       setMessages((prev) => prev.filter((m) => m.id !== tempId));
//       return;
//     }

//     if (!data) {
//       console.warn("⚠ Insert sin data (RLS?)");
//       return;
//     }

//     setMessages((prev) => [data, ...prev.filter((m) => m.id !== tempId)]);
//   }, [newMessage, chatId, currentUserId]);

//   const renderItem = useCallback(
//     ({ item }) => {
//       const isMe = item.sender_id === currentUserId;

//       return (
//         <View
//           className={`mb-2 flex-row ${isMe ? "justify-end" : "justify-start"}`}
//         >
//           <View
//             className={`px-4 py-2 rounded-2xl max-w-[80%] ${
//               isMe ? "bg-blue-500" : "bg-gray-300"
//             }`}
//           >
//             <Text className={isMe ? "text-white" : "text-gray-900"}>
//               {item.text}
//             </Text>
//           </View>
//         </View>
//       );
//     },
//     [currentUserId]
//   );

//   // Loading Clerk
//   if (!isLoaded) {
//     return (
//       <View className="flex-1 items-center justify-center bg-white">
//         <ActivityIndicator size="large" />
//         <Text className="mt-2 text-gray-500">Cargando usuario...</Text>
//       </View>
//     );
//   }

//   // No autenticado
//   if (!isSignedIn) {
//     return (
//       <View className="flex-1 items-center justify-center bg-white">
//         <Text className="text-gray-500">
//           Debes iniciar sesión para usar el chat.
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//       className="flex-1 bg-white"
//     >
//       <Stack.Screen
//         options={{
//           headerStyle: { backgroundColor: "white" },
//           headerTitle: () => (
//             <Pressable
//               onPress={() =>
//                 router.push({
//                   pathname: "indexScreens/profile/[id]",
//                   params: { index: userId },
//                 })
//               }
//               className="flex-row items-center"
//             >
//               <Image
//                 source={{
//                   uri: avatar || "https://via.placeholder.com/40",
//                 }}
//                 className="w-10 h-10 rounded-full mr-2"
//               />
//               <View>
//                 <Text className="text-gray-800 font-semibold text-lg">
//                   {headerTitle}
//                 </Text>
//                 {time ? (
//                   <Text className="text-xs text-gray-400">{time}</Text>
//                 ) : null}
//               </View>
//             </Pressable>
//           ),
//           headerRight: () => (
//             <>
//               <View>
//                 <Pressable onPress={() => setChatOptionsVisible(true)}>
//                   <Dots color={"#374151"} size={24} />
//                 </Pressable>
//               </View>

//               <ChatDetailModal
//                 visible={chatOptionsVisible}
//                 onClose={() => setChatOptionsVisible(false)}
//                 onReport={() => {
//                   // aquí puedes meter lógica real de "reportar"
//                   console.log("🚨 Reportar chat");
//                 }}
//                 onBlock={() => {
//                   // aquí puedes meter lógica real de "bloquear"
//                   console.log("⛔ Bloquear usuario");
//                 }}
//               />
//             </>
//           ),
//         }}
//       />

//       <View className="flex-1 p-4">
//         {loadingMessages ? (
//           <View className="flex-1 items-center justify-center">
//             <ActivityIndicator size="large" />
//             <Text className="mt-2 text-gray-500">Cargando mensajes...</Text>
//           </View>
//         ) : (
//           <FlatList
//             data={messages}
//             keyExtractor={(item) => String(item.id)}
//             renderItem={renderItem}
//             inverted
//             ListEmptyComponent={
//               <Text className="text-center text-gray-400 mt-4">
//                 No hay mensajes todavía
//               </Text>
//             }
//           />
//         )}
//       </View>

//       <View className="flex-row items-center p-3 border-t border-gray-200">
//         <TextInput
//           value={newMessage}
//           onChangeText={setNewMessage}
//           placeholder="Escribe un mensaje..."
//           className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
//           multiline
//         />
//         <Pressable
//           onPress={sendMessage}
//           className={`ml-2 rounded-full px-3 py-2 ${
//             newMessage.trim() && currentUserId && chatId
//               ? "bg-blue-500"
//               : "bg-blue-300"
//           }`}
//           disabled={sending || !newMessage.trim() || !currentUserId || !chatId}
//         >
//           <Text className="text-white font-bold">
//             {sending ? "..." : "Enviar"}
//           </Text>
//         </Pressable>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

import React, { useState, useEffect, useCallback } from "react";
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

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default function ChatDetail() {
  const router = useRouter();
  const { userId, name } = useLocalSearchParams();
  const chatId = Array.isArray(userId) ? userId[0] : userId;

  const { isLoaded, isSignedIn, user } = useUser();

  const [chatOptionsVisible, setChatOptionsVisible] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [peerUserId, setPeerUserId] = useState(null);
  const [peer, setPeer] = useState({
    username: "Chat",
    avatar: FALLBACK_AVATAR,
  });

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // 1) currentUserId (tabla user) desde clerk_id
  const fetchCurrentUserId = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const { data, error } = await supabase
      .from("user")
      .select("id")
      .eq("clerk_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("❌ Error cargando user actual:", error.message);
      return;
    }
    if (!data?.id) {
      console.warn("⚠ No existe fila en user para este clerk_id");
      return;
    }
    setCurrentUserId(data.id);
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    fetchCurrentUserId();
  }, [fetchCurrentUserId]);

  // useEffect(() => {
  //   console.log(chatId);
  //   console.log(id);
  // }, [chatId, id]);

  // 2) peer desde chat_members + user (join correcto)
  // Nota: esto depende de que chat_members.user_id tenga FK a user.id
  const fetchPeerFromChat = useCallback(async () => {
    if (!chatId || !currentUserId) return;

    const { data, error } = await supabase
      .from("chat_members")
      .select(
        `
        user_id,
        user:user_id (
          id,
          username,
          profile_pic
        )
      `
      )
      .eq("chat_id", chatId);

    if (error) {
      console.error("❌ Error cargando chat_members:", error.message);
      return;
    }

    const members = data ?? [];
    const other = members.find((m) => m.user_id !== currentUserId);

    if (!other?.user) {
      console.warn(
        "⚠ No encontré peer.user. Revisa FK chat_members.user_id -> user.id y/o RLS."
      );
      setPeer({ username: "Chat", avatar: FALLBACK_AVATAR });
      setPeerUserId(null);
      return;
    }

    setPeer({
      username: other.user.username || "Chat",
      avatar: other.user.profile_pic || FALLBACK_AVATAR,
    });
    setPeerUserId(other.user.id);
  }, [chatId, currentUserId]);

  useEffect(() => {
    fetchPeerFromChat();
  }, [fetchPeerFromChat]);

  // 3) mensajes
  const fetchMessages = useCallback(async () => {
    if (!chatId) return;

    setLoadingMessages(true);

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching messages:", error.message);
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setMessages(data || []);
    setLoadingMessages(false);
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 4) realtime
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // 5) enviar
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;
    if (!chatId || !currentUserId) return;

    const text = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      text,
      chat_id: chatId,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [optimisticMessage, ...prev]);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        sender_id: currentUserId,
        text,
      })
      .select("*")
      .maybeSingle();

    setSending(false);

    if (error) {
      console.error("❌ Error insertando mensaje:", error.message);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    if (data) {
      setMessages((prev) => [data, ...prev.filter((m) => m.id !== tempId)]);
    }
  }, [newMessage, chatId, currentUserId]);

  const renderItem = useCallback(
    ({ item }) => {
      const isMe = item.sender_id === currentUserId;

      return (
        <View
          className={`mb-2 flex-row ${isMe ? "justify-end" : "justify-start"}`}
        >
          <View
            className={`px-4 py-2 rounded-2xl max-w-[80%] ${
              isMe ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <Text className={isMe ? "text-white" : "text-gray-900"}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    },
    [currentUserId]
  );

  // --- UI states ---
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-500">Cargando usuario...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">
          Debes iniciar sesión para usar el chat.
        </Text>
      </View>
    );
  }

  // IMPORTANTE: en vez de "Chat inválido" directo, mostramos loader,
  // porque Expo Router a veces entrega params después del primer render.
  if (!chatId) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-500">Abriendo chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: () => (
            <Pressable
              onPress={() => {
                if (!peerUserId) return;
                router.push({
                  pathname: "indexScreens/profile/[id]",
                  params: { index: peerUserId },
                });
              }}
              className="flex-row items-center"
            >
              <Image
                source={{ uri: peer.avatar || FALLBACK_AVATAR }}
                className="w-10 h-10 rounded-full mr-2"
              />
              <Text className="text-gray-800 font-semibold text-lg">
                {peer.username}
              </Text>
            </Pressable>
          ),
          headerRight: () => (
            <>
              <Pressable onPress={() => setChatOptionsVisible(true)}>
                <Dots color={"#374151"} size={24} />
              </Pressable>

              <ChatDetailModal
                visible={chatOptionsVisible}
                onClose={() => setChatOptionsVisible(false)}
                onReport={() => console.log("🚨 Reportar chat")}
                onBlock={() => console.log("⛔ Bloquear usuario")}
              />
            </>
          ),
        }}
      />

      <View className="flex-1 p-4">
        {loadingMessages ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
            <Text className="mt-2 text-gray-500">Cargando mensajes...</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            inverted
            ListEmptyComponent={
              <Text className="text-center text-gray-400 mt-4">
                No hay mensajes todavía
              </Text>
            }
          />
        )}
      </View>

      <View className="flex-row items-center p-3 border-t border-gray-200">
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
          multiline
        />
        <Pressable
          onPress={sendMessage}
          className={`ml-2 rounded-full px-3 py-2 ${
            newMessage.trim() && currentUserId ? "bg-blue-500" : "bg-blue-300"
          }`}
          disabled={sending || !newMessage.trim() || !currentUserId}
        >
          <Text className="text-white font-bold">
            {sending ? "..." : "Enviar"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
