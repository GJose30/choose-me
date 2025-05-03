import { useNotifications } from "../../contexts/NotificationContext";
import { View, Text, FlatList, Image } from "react-native";
import { Stack } from "expo-router";
import { NotificationIcon } from "../../components/Icon";

export default function Notification() {
  const { notifications } = useNotifications();

  return (
    <View className="bg-white flex-1 p-4">
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: "Notificaciones",
        }}
      />
      {notifications.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <View className="m-4">
            <NotificationIcon className="text-gray-600" />
          </View>
          <Text className="font-medium text-gray-800 text-lg">
            Aún no hay notificaciones
          </Text>
          <Text className="font-medium text-sm text-gray-500">
            No tienes notificaciones por el momento
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-3 mb-4">
              <Image
                source={{ uri: item.logo }}
                className="w-12 h-12 rounded-full"
              />
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">
                  {item.nombre}
                </Text>
                <Text className="text-gray-600">{item.title}</Text>
                <Text className="text-gray-400 text-xs">
                  {new Date(item.fecha).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
