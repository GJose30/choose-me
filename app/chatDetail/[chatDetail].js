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
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "../../lib/supabase";

export default function ChatDetail() {
  const params = useLocalSearchParams();
  const { id, name, avatar, time } = params;

  // Soportar ambos: chatId o id (por ahora usamos lo que venga)
  // const effectiveChatId = chatId || id;
  const effectiveChatId = id;

  const { isLoaded, isSignedIn, user } = useUser();

  const [currentUserId, setCurrentUserId] = useState(null); // id interno de la tabla user
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");

  // 1) Traer la fila del usuario en Supabase a partir de Clerk
  const fetchUser = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (error) {
      console.error("Error cargando userRow:", error.message);
      return;
    }

    if (data) {
      // Este id es el que usarás como sender_id en chat_messages
      setCurrentUserId(data.id);
    }
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    fetchUser();
    // console.log(user.id);
    console.log(id);
  }, [fetchUser, id]);

  // 2) Cargar mensajes del chat
  const fetchMessages = useCallback(async () => {
    if (!effectiveChatId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", effectiveChatId)
      .order("created_at", { ascending: false }); // porque usamos inverted

    if (error) {
      console.error("Error fetching messages:", error.message);
      setLoading(false);
      return;
    }

    setMessages(data || []);
    setLoading(false);
  }, [effectiveChatId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 3) Realtime: escuchar nuevos mensajes de ese chat
  useEffect(() => {
    if (!effectiveChatId) return;

    const channel = supabase
      .channel(`chat-messages-${effectiveChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${effectiveChatId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => [newMsg, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveChatId]);

  // 4) Enviar mensaje
  const sendMessage = async () => {
    console.log("▶ sendMessage llamado");

    if (!newMessage.trim()) {
      console.log("⛔ No hay texto en el mensaje");
      return;
    }

    if (!effectiveChatId) {
      console.log("⛔ No hay effectiveChatId");
      return;
    }

    if (!currentUserId) {
      console.log("⛔ No hay currentUserId (usuario aún no cargado)");
      return;
    }

    const text = newMessage.trim();
    setNewMessage("");

    console.log("✉ Insertando mensaje en BD:", {
      chat_id: effectiveChatId,
      sender_id: currentUserId,
      text,
    });

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      text,
      chat_id: String(effectiveChatId),
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
    };

    // Optimista: se ve en la UI aunque falle el insert
    setMessages((prev) => [optimisticMessage, ...prev]);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: effectiveChatId,
        sender_id: currentUserId,
        text,
      })
      .select("*")
      .maybeSingle(); // si no tienes maybeSingle puedes dejar .select()

    console.log("✅ Resultado insert:", { data, error });

    if (error) {
      console.error("❌ Error sending message:", error.message);
      // rollback del optimista si falla
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    if (!data) {
      console.warn("⚠ No se devolvió data en el insert (revisa RLS/policies)");
      return;
    }

    // Reemplazar temporal por el real
    setMessages((prev) => [data, ...prev.filter((m) => m.id !== tempId)]);
  };

  const renderItem = ({ item }) => {
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
  };

  const headerTitle = name || "Chat";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: () => (
            <View className="flex-row items-center">
              <Image
                source={{
                  uri: avatar || "https://via.placeholder.com/40",
                }}
                className="w-10 h-10 rounded-full mr-2"
              />
              <View>
                <Text className="text-gray-800 font-semibold text-lg">
                  {headerTitle}
                </Text>
                {time ? (
                  <Text className="text-xs text-gray-400">{time}</Text>
                ) : null}
              </View>
            </View>
          ),
        }}
      />

      <View className="flex-1 p-4">
        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          inverted
          ListEmptyComponent={
            !loading ? (
              <Text className="text-center text-gray-400 mt-4">
                No hay mensajes todavía
              </Text>
            ) : null
          }
        />
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
          className="ml-2 bg-blue-500 rounded-full px-3 py-2"
          disabled={!currentUserId || !effectiveChatId}
        >
          <Text className="text-white font-bold">Enviar</Text>
        </Pressable>
        {/* <Pressable
          onPress={sendMessage}
          className="p-6 border-y-4 border-x-4"
          style={({ pressed }) => [
            {
              backgroundColor: pressed ? "rgb(210, 230, 255)" : "white",
            },
          ]}
        >
          {({ pressed }) => (
            <Text className="text-lg">{pressed ? "Pressed!" : "Press Me"}</Text>
          )}
        </Pressable> */}
      </View>
    </KeyboardAvoidingView>
  );
}
