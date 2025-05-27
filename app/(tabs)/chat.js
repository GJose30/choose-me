import { View, Text, FlatList, Pressable, Image } from "react-native";
import { Stack, Link } from "expo-router";

const mockChats = [
  {
    id: "1",
    name: "Gil Arauz",
    lastMessage: "¡Hola! ¿Cómo estás?",
    time: "2:45 PM",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "2",
    name: "Fundación Happy Feet",
    lastMessage: "Gracias por tu apoyo 🐾",
    time: "1:10 PM",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "3",
    name: "Carlos López",
    lastMessage: "¿Nos vemos mañana?",
    time: "11:30 AM",
    avatar: "https://randomuser.me/api/portraits/men/55.jpg",
  },
];

export default function Chat() {
  const renderItem = ({ item }) => (
    <Link
      href={{
        pathname: "chatDetail/[id]",
        params: {
          name: item.name,
          avatar: item.avatar,
          time: item.time,
        },
      }}
      asChild
    >
      <Pressable className="flex-row items-center p-4 border-b border-gray-200">
        <Image
          source={{ uri: item.avatar }}
          className="w-12 h-12 rounded-full mr-4"
        />
        <View className="flex-1">
          <Text className="font-bold text-gray-800 text-base">{item.name}</Text>
          <Text className="text-gray-500">{item.lastMessage}</Text>
        </View>
        <Text className="text-gray-400 text-xs">{item.time}</Text>
      </Pressable>
    </Link>
  );

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: "Mensajes",
        }}
      />
      <FlatList
        data={mockChats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}
