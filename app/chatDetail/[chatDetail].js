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
import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";

export default function ChatDetail() {
  const [messages, setMessages] = useState([
    { id: "1", text: "Hola, ¿cómo estás?", sender: "other" },
    { id: "2", text: "¡Muy bien! ¿Y tú?", sender: "me" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const { name, avatar, time } = useLocalSearchParams();

  const sendMessage = () => {
    if (newMessage.trim() === "") return;
    setMessages((prev) => [
      { id: Date.now().toString(), text: newMessage, sender: "me" },
      ...prev,
    ]);
    setNewMessage("");
  };

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
                source={{ uri: avatar || "https://via.placeholder.com/40" }}
                className="w-10 h-10 rounded-full mr-2"
              />
              <Text className="text-gray-800 font-semibold text-lg">
                {name || "Usuario"}
              </Text>
            </View>
          ),
        }}
      />

      <View className="flex-1 p-4">
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              className={`mb-2 ${
                item.sender === "me" ? "items-end" : "items-start"
              }`}
            >
              <View
                className={`px-4 py-2 rounded-lg ${
                  item.sender === "me" ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <Text className="text-white">{item.text}</Text>
              </View>
            </View>
          )}
          inverted
        />
      </View>

      <View className="flex-row items-center p-3 border-t border-gray-200">
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
        />
        <Pressable
          onPress={sendMessage}
          className="ml-2 bg-blue-500 rounded-full p-3"
        >
          <Text className="text-white font-bold">Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
